import streamlit as st
import folium
from streamlit_folium import st_folium
import json
import pandas as pd
import math

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="India Governance Pulse",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ──────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

html, body, [class*="css"] { font-family: 'DM Sans', sans-serif; }
.main { background: #0d1117; }

[data-testid="stSidebar"] { background: #161b22; border-right: 1px solid #30363d; }
[data-testid="stSidebar"] * { color: #c9d1d9 !important; }

.metric-card {
    background: #161b22; border: 1px solid #30363d; border-radius: 10px;
    padding: 16px 20px; text-align: center;
}
.metric-card .label {
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    color: #8b949e; margin-bottom: 6px;
}
.metric-card .value {
    font-family: 'DM Serif Display', serif; font-size: 28px;
    color: #e6edf3; line-height: 1;
}
.metric-card .sub { font-size: 11px; color: #8b949e; margin-top: 4px; }

.post-card {
    background: #161b22; border: 1px solid #30363d; border-radius: 10px;
    padding: 14px 16px; margin-bottom: 10px; border-left: 4px solid #e74c3c;
}
.post-card.positive { border-left-color: #2ecc71; }
.post-card.neutral  { border-left-color: #f39c12; }
.post-card .topic { font-weight: 600; font-size: 13px; color: #e6edf3; margin-bottom: 4px; }
.post-card .brief { font-size: 12px; color: #8b949e; line-height: 1.5; margin-bottom: 8px; }
.post-card .meta { display: flex; gap: 12px; font-size: 11px; color: #6e7681; }
.tag {
    display: inline-block; background: #21262d; border: 1px solid #30363d;
    border-radius: 20px; padding: 2px 8px; font-size: 10px;
    color: #8b949e; margin: 2px 2px 2px 0;
}

.app-title {
    font-family: 'DM Serif Display', serif; font-size: 32px;
    color: #e6edf3; margin: 0; line-height: 1.1;
}
.app-sub { font-size: 13px; color: #8b949e; margin-top: 4px; }

.section-header {
    font-family: 'DM Serif Display', serif; font-size: 18px; color: #e6edf3;
    border-bottom: 1px solid #30363d; padding-bottom: 8px; margin: 20px 0 14px;
}
</style>
""", unsafe_allow_html=True)


# ── Helpers ─────────────────────────────────────────────────────────────────────

def sentiment_color(score: float) -> str:
    """Map a -1..+1 score to a red→green hex colour."""
    t = (score + 1) / 2          # normalise to 0..1
    t = max(0.0, min(1.0, t))
    r = int(255 * (1 - t))
    g = int(200 * t)
    return f"#{r:02x}{g:02x}3c"

def sentiment_label(score: float) -> str:
    if score < -0.2:
        return "negative"
    elif score > 0.2:
        return "positive"
    return "neutral"

def flatten_to_rows(data: list) -> list:
    """
    Explode each post's locations list so every (post × location) becomes
    one row.  Coordinates come directly from the JSON — no geocoding needed.
    """
    rows = []
    for post in data:
        locs = post.get("locations", [])
        if not locs:
            continue

        all_loc_names = ", ".join(loc["name"] for loc in locs if loc.get("name"))
        score = float(post.get("sentiment_score", 0))

        for loc in locs:
            lat = loc.get("latitude")
            lon = loc.get("longitude")
            if lat is None or lon is None:
                continue

            # Tiny jitter so overlapping markers don't stack exactly
            jitter = (hash(post.get("topic", "") + loc["name"]) % 20 - 10) * 0.003

            rows.append({
                "topic":           post.get("topic", "Unknown"),
                "brief":           post.get("brief", ""),
                "location":        loc["name"],
                "lat":             lat + jitter,
                "lon":             lon + jitter,
                "sentiment_score": score,
                "votes":           int(post.get("votes", 0)),
                "subreddit":       post.get("subreddit", ""),
                "original_title":  post.get("original_title", ""),
                "sentiment_label": sentiment_label(score),
                "color":           sentiment_color(score),
                "all_locations":   all_loc_names,
            })
    return rows


# ── Data loading ─────────────────────────────────────────────────────────────────

def parse_uploaded(uploaded_file) -> list:
    try:
        data = json.loads(uploaded_file.read())
        return data if isinstance(data, list) else [data]
    except Exception as e:
        st.error(f"Error parsing JSON: {e}")
        return []

@st.cache_data
def load_default_json() -> list:
    try:
        with open("complaint_data_with_coords.json") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


# ── Sidebar ─────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🗺️ India Governance Pulse")
    st.markdown("---")

    st.markdown("### 📂 Data Source")
    source = st.radio("", ["Use default JSON", "Upload JSON"], label_visibility="collapsed")

    raw_data = []
    if source == "Use default JSON":
        raw_data = load_default_json()
        if raw_data:
            st.caption(f"Loaded {len(raw_data)} posts from complaint_data_with_coords.json")
        else:
            st.warning("complaint_data_with_coords.json not found in working directory.")
    else:
        uploaded = st.file_uploader("Upload complaint JSON", type=["json"])
        if uploaded:
            raw_data = parse_uploaded(uploaded)
            st.success(f"Loaded {len(raw_data)} posts")
        else:
            st.info("Upload a complaint_data_with_coords.json file")

    st.markdown("---")
    st.markdown("### 🎛️ Filters")

    rows = flatten_to_rows(raw_data)
    df = pd.DataFrame(rows) if rows else pd.DataFrame()

    if not df.empty:
        all_topics = sorted(df["topic"].unique().tolist())
        selected_topics = st.multiselect("Topics", all_topics, default=all_topics)

        sent_options = ["negative", "neutral", "positive"]
        selected_sent = st.multiselect("Sentiment", sent_options, default=sent_options)

        min_v, max_v = int(df["votes"].min()), int(df["votes"].max())
        min_votes = st.slider("Min votes", min_v, max(max_v, min_v + 1), min_v) if min_v < max_v else min_v

        df = df[df["topic"].isin(selected_topics)]
        df = df[df["sentiment_label"].isin(selected_sent)]
        df = df[df["votes"] >= min_votes]

    st.markdown("---")
    st.markdown("### 🗃️ Map Style")
    map_tile = st.selectbox("Tile Layer", [
        "CartoDB dark_matter", "CartoDB positron", "OpenStreetMap"
    ])
    marker_scale = st.slider("Marker size scale", 0.5, 3.0, 1.0, 0.1)

    st.markdown("---")
    st.markdown("""
    ### 🔑 Legend
    <div style="font-size:12px; color:#8b949e;">
    🔴 Negative sentiment<br>
    🟡 Neutral sentiment<br>
    🟢 Positive sentiment<br><br>
    <em>Marker size ∝ votes</em>
    </div>
    """, unsafe_allow_html=True)


# ── Header ───────────────────────────────────────────────────────────────────────
st.markdown("""
<p class="app-title">India Governance Pulse</p>
<p class="app-sub">Reddit complaint intelligence — mapped in real time</p>
""", unsafe_allow_html=True)


# ── Metrics row ──────────────────────────────────────────────────────────────────
if not df.empty:
    c1, c2, c3, c4, c5 = st.columns(5)
    total_posts = len(raw_data)
    total_locs  = df["location"].nunique()
    avg_sent    = df.drop_duplicates("topic")["sentiment_score"].mean()
    total_votes = df.drop_duplicates("topic")["votes"].sum()
    neg_pct     = (df[df["sentiment_label"] == "negative"]["topic"].nunique() /
                   max(df["topic"].nunique(), 1)) * 100

    for col, label, val, sub in [
        (c1, "Total Posts",   str(total_posts),       "loaded"),
        (c2, "Locations",     str(total_locs),         "on map"),
        (c3, "Avg Sentiment", f"{avg_sent:.2f}",       "−1 → +1"),
        (c4, "Total Votes",   f"{total_votes:,}",      "community signal"),
        (c5, "Negative %",    f"{neg_pct:.0f}%",       "of posts"),
    ]:
        col.markdown(f"""
        <div class="metric-card">
          <div class="label">{label}</div>
          <div class="value">{val}</div>
          <div class="sub">{sub}</div>
        </div>""", unsafe_allow_html=True)

st.markdown("")


# ── Map + Panel ──────────────────────────────────────────────────────────────────
map_col, panel_col = st.columns([2, 1])

with map_col:
    st.markdown('<div class="section-header">📍 Complaint Map</div>', unsafe_allow_html=True)

    m = folium.Map(location=[22.5, 82.0], zoom_start=4, tiles=map_tile, control_scale=True)

    if not df.empty:
        for _, row in df.iterrows():
            radius = max(6, math.log1p(row["votes"] + 1) * 2.5 * marker_scale)
            popup_html = f"""
            <div style="font-family:DM Sans,sans-serif;min-width:230px;padding:4px;">
              <b style="font-size:13px;color:#e74c3c;">{row['topic']}</b><br>
              <span style="font-size:11px;color:#555;">{row['brief'][:160]}{'...' if len(row['brief'])>160 else ''}</span>
              <hr style="margin:6px 0;border-color:#eee;">
              <span style="font-size:11px;">📍 {row['all_locations']}</span><br>
              <span style="font-size:11px;">
                ⬆ {row['votes']} votes &nbsp;|&nbsp;
                Sentiment: <b>{row['sentiment_score']:.2f}</b> &nbsp;|&nbsp;
                r/{row['subreddit']}
              </span>
            </div>"""

            folium.CircleMarker(
                location=[row["lat"], row["lon"]],
                radius=radius,
                color=row["color"],
                fill=True,
                fill_color=row["color"],
                fill_opacity=0.75,
                weight=1.5,
                tooltip=f"{row['topic']} — {row['location']}",
                popup=folium.Popup(popup_html, max_width=290),
            ).add_to(m)

        folium.LayerControl().add_to(m)

    st_folium(m, width="100%", height=560, returned_objects=["last_object_clicked"])


with panel_col:
    st.markdown('<div class="section-header">📋 Top Posts</div>', unsafe_allow_html=True)

    if not df.empty:
        top_posts = (df.drop_duplicates("topic")
                       .sort_values("votes", ascending=False)
                       .head(12))

        for _, row in top_posts.iterrows():
            cls = row["sentiment_label"]
            tags_html = "".join(
                f'<span class="tag">{loc.strip()}</span>'
                for loc in row["all_locations"].split(",")[:3]
            )
            st.markdown(f"""
            <div class="post-card {cls}">
              <div class="topic">{row['topic']}</div>
              <div class="brief">{row['brief'][:120]}{'...' if len(row['brief'])>120 else ''}</div>
              <div>{tags_html}<span class="tag">r/{row['subreddit']}</span></div>
              <div class="meta">
                <span>⬆ {row['votes']}</span>
                <span>Sentiment: {row['sentiment_score']:.2f}</span>
              </div>
            </div>""", unsafe_allow_html=True)
    else:
        st.info("Load data to see posts here.")


# ── Breakdown charts ─────────────────────────────────────────────────────────────
if not df.empty:
    st.markdown('<div class="section-header">📊 Topic & Location Breakdown</div>', unsafe_allow_html=True)
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Complaint volume by location**")
        st.bar_chart(df["location"].value_counts().head(10), height=200, use_container_width=True)

    with col2:
        st.markdown("**Average sentiment per topic**")
        topic_sent = df.groupby("topic")["sentiment_score"].mean().sort_values().head(10)
        st.bar_chart(topic_sent, height=200, use_container_width=True)


# ── Raw data table ───────────────────────────────────────────────────────────────
if not df.empty:
    with st.expander("🔍 Raw mapped data table"):
        st.dataframe(
            df[["topic", "location", "sentiment_score", "sentiment_label",
                "votes", "subreddit", "brief"]]
              .sort_values("votes", ascending=False)
              .reset_index(drop=True),
            use_container_width=True,
            height=300,
        )

st.markdown("""
<div style="text-align:center;color:#6e7681;font-size:11px;margin-top:30px;
            padding-top:16px;border-top:1px solid #30363d;">
  India Governance Pulse &nbsp;·&nbsp; Streamlit + Folium &nbsp;·&nbsp; Data via Reddit scraper
</div>
""", unsafe_allow_html=True)