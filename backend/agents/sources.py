from dataclasses import dataclass, field


@dataclass
class BlocSources:
    code: str
    name: str
    rss_feeds: list[str] = field(default_factory=list)
    gdelt_domains: list[str] = field(default_factory=list)
    gdelt_countries: list[str] = field(default_factory=list)
    gdelt_languages: list[str] = field(default_factory=list)


BLOC_SOURCES: dict[str, BlocSources] = {
    'CN': BlocSources(
        code='CN', name='China',
        rss_feeds=[
            'https://www.cgtn.com/subscribe/rss/section/world.xml',
            'https://www.cgtn.com/subscribe/rss/section/china.xml',
            'http://www.xinhuanet.com/english/rss/worldrss.xml',
        ],
        gdelt_domains=['cgtn.com', 'xinhuanet.com', 'globaltimes.cn'],
        gdelt_countries=['CH'],
        gdelt_languages=['Chinese', 'English'],
    ),
    'RU': BlocSources(
        code='RU', name='Russia',
        rss_feeds=[
            'https://www.rt.com/rss/news/',
            'https://www.rt.com/rss/world/',
            'https://tass.com/rss/v2.xml',
            'https://sputnikglobe.com/export/rss2/archive/index.xml',
        ],
        gdelt_domains=['rt.com', 'tass.com', 'sputnikglobe.com'],
        gdelt_countries=['RS'],
        gdelt_languages=['Russian', 'English'],
    ),
    'ME': BlocSources(
        code='ME', name='Middle East',
        rss_feeds=[
            'https://www.aljazeera.com/xml/rss/all.xml',
            'https://www.trtworld.com/rss',
            'https://www.presstv.ir/rss.xml',
        ],
        gdelt_domains=['aljazeera.com', 'aljazeera.net', 'trtworld.com', 'presstv.ir'],
        gdelt_countries=['QA', 'TU', 'IR'],
        gdelt_languages=['Arabic', 'English'],
    ),
    'EU': BlocSources(
        code='EU', name='Europe',
        rss_feeds=[
            'https://feeds.bbci.co.uk/news/world/rss.xml',
            'https://rss.dw.com/rdf/rss-en-world',
            'https://www.france24.com/en/rss',
            'https://www.euronews.com/rss?level=theme&name=news',
        ],
        gdelt_domains=['bbc.com', 'bbc.co.uk', 'dw.com', 'france24.com', 'euronews.com'],
        gdelt_countries=['UK', 'GM', 'FR'],
        gdelt_languages=['English', 'German', 'French'],
    ),
    'WS': BlocSources(
        code='WS', name='Wire Services',
        rss_feeds=[],
        gdelt_domains=['reuters.com', 'apnews.com', 'afp.com'],
        gdelt_countries=['UK', 'US', 'FR'],
        gdelt_languages=['English'],
    ),
    'US': BlocSources(
        code='US', name='US/Western',
        rss_feeds=[
            'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
            'https://feeds.washingtonpost.com/rss/world',
            'http://rss.cnn.com/rss/edition_world.rss',
            'https://moxie.foxnews.com/google-publisher/world.xml',
        ],
        gdelt_domains=['nytimes.com', 'washingtonpost.com', 'cnn.com', 'foxnews.com'],
        gdelt_countries=['US'],
        gdelt_languages=['English'],
    ),
    'IN': BlocSources(
        code='IN', name='India',
        rss_feeds=[
            'https://www.thehindu.com/news/international/feeder/default.rss',
            'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
            'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
        ],
        gdelt_domains=['thehindu.com', 'timesofindia.indiatimes.com',
                       'hindustantimes.com', 'aninews.in'],
        gdelt_countries=['IN'],
        gdelt_languages=['English', 'Hindi'],
    ),
    'GS': BlocSources(
        code='GS', name='Global South',
        rss_feeds=[
            'https://www.prensa-latina.cu/feed/',
            'https://www.telesurenglish.net/rss/index.html',
            'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf',
            'https://www.dailymaverick.co.za/feed/',
        ],
        gdelt_domains=['prensa-latina.cu', 'telesurenglish.net',
                       'allafrica.com', 'dailymaverick.co.za'],
        gdelt_countries=['CU', 'VE', 'SF'],
        gdelt_languages=['Spanish', 'English'],
    ),
}


def get_bloc_sources(name_or_code: str) -> BlocSources | None:
    """
    Get a BlocSources by code (e.g. 'CN') or name (e.g. 'China').
    Case-insensitive for names.
    Returns None if not found.
    """
    if name_or_code in BLOC_SOURCES:
        return BLOC_SOURCES[name_or_code]
    for src in BLOC_SOURCES.values():
        if src.name.lower() == name_or_code.lower():
            return src
    return None
