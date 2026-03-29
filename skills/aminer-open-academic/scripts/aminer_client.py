#!/usr/bin/env python3
"""
AMiner 开放平台 API 客户端
支持 6 大学术数据查询工作流及全部 28 个独立 API

使用方法：
    python aminer_client.py --token <TOKEN> --action <ACTION> [选项]

工作流：
    scholar_profile   学者全景分析（搜索→详情+画像+论文+专利+项目）
    paper_deep_dive   论文深度挖掘（搜索→详情+引用链）
    org_analysis      机构研究力分析（消歧→详情+学者+论文+专利）
    venue_papers      期刊论文监控（搜索→详情+按年份论文）
    paper_qa          学术智能问答（AI驱动关键词搜索）
    patent_search     专利搜索与详情
    scholar_patents   通过学者名获取其所有专利详情

直接调用单个 API：
    raw               直接调用任意 API，需指定 --api 和 --params

控制台（生成Token）：https://open.aminer.cn/open/board?tab=control
文档：https://open.aminer.cn/open/doc
"""

import argparse
import json
import sys
import time
import random
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Optional

BASE_URL = "https://datacenter.aminer.cn/gateway/open_platform"

TEST_TOKEN = ""  # 请前往 https://open.aminer.cn/open/board?tab=control 生成你自己的 Token

REQUEST_TIMEOUT_SECONDS = 30
MAX_RETRIES = 3
RETRYABLE_HTTP_STATUS = {408, 429, 500, 502, 503, 504}


# ──────────────────────────────────────────────────────────────────────────────
# 核心 HTTP 工具
# ──────────────────────────────────────────────────────────────────────────────

def _request(token: str, method: str, path: str,
             params: Optional[dict] = None,
             body: Optional[dict] = None) -> Any:
    """发送 HTTP 请求并返回解析后的 JSON 数据（含重试）。"""
    url = BASE_URL + path
    headers = {
        "Authorization": token,
        "Content-Type": "application/json;charset=utf-8",
    }

    if method.upper() == "GET" and params:
        query = urllib.parse.urlencode(
            {k: (json.dumps(v) if isinstance(v, (list, dict)) else v)
             for k, v in params.items() if v is not None}
        )
        url = f"{url}?{query}"

    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            body_bytes = e.read()
            try:
                err = json.loads(body_bytes)
            except Exception:
                err = body_bytes.decode("utf-8", errors="replace")
            retryable = e.code in RETRYABLE_HTTP_STATUS
            print(f"[HTTP {e.code}] {e.reason}: {err}", file=sys.stderr)
            if retryable and attempt < MAX_RETRIES:
                backoff = (2 ** (attempt - 1)) + random.uniform(0, 0.3)
                print(f"[重试] attempt={attempt}/{MAX_RETRIES} wait={backoff:.2f}s", file=sys.stderr)
                time.sleep(backoff)
                continue
            return {
                "code": e.code,
                "success": False,
                "msg": str(e.reason),
                "error": err,
                "retryable": retryable,
            }
        except urllib.error.URLError as e:
            reason = str(getattr(e, "reason", e))
            print(f"[请求失败] {reason}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                backoff = (2 ** (attempt - 1)) + random.uniform(0, 0.3)
                print(f"[重试] attempt={attempt}/{MAX_RETRIES} wait={backoff:.2f}s", file=sys.stderr)
                time.sleep(backoff)
                continue
            return {
                "code": -1,
                "success": False,
                "msg": "network_error",
                "error": reason,
                "retryable": True,
            }
        except TimeoutError as e:
            print(f"[请求超时] {e}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                backoff = (2 ** (attempt - 1)) + random.uniform(0, 0.3)
                print(f"[重试] attempt={attempt}/{MAX_RETRIES} wait={backoff:.2f}s", file=sys.stderr)
                time.sleep(backoff)
                continue
            return {
                "code": -1,
                "success": False,
                "msg": "timeout",
                "error": str(e),
                "retryable": True,
            }
        except Exception as e:
            print(f"[请求失败] {e}", file=sys.stderr)
            return {
                "code": -1,
                "success": False,
                "msg": "unknown_error",
                "error": str(e),
                "retryable": False,
            }

    return {
        "code": -1,
        "success": False,
        "msg": "request_failed",
        "error": "max retries exceeded",
        "retryable": True,
    }


def _print(data: Any) -> None:
    """格式化打印 JSON 结果。"""
    print(json.dumps(data, ensure_ascii=False, indent=2))


# ──────────────────────────────────────────────────────────────────────────────
# 论文类 API
# ──────────────────────────────────────────────────────────────────────────────

def paper_search(token: str, title: str, page: int = 0, size: int = 10) -> Any:
    """论文搜索（免费）：根据标题搜索，返回 ID/标题/DOI。"""
    return _request(token, "GET", "/api/paper/search",
                    params={"title": title, "page": page, "size": size})


def paper_search_pro(token: str, title: str = None, keyword: str = None,
                     abstract: str = None, author: str = None,
                     org: str = None, venue: str = None,
                     order: str = None, page: int = 0, size: int = 10) -> Any:
    """论文搜索 pro（¥0.01/次）：多条件搜索。"""
    params = {"page": page, "size": size}
    for k, v in [("title", title), ("keyword", keyword), ("abstract", abstract),
                 ("author", author), ("org", org), ("venue", venue), ("order", order)]:
        if v is not None:
            params[k] = v
    return _request(token, "GET", "/api/paper/search/pro", params=params)


def paper_qa_search(token: str, query: str = None,
                    use_topic: bool = False,
                    topic_high: str = None, topic_middle: str = None, topic_low: str = None,
                    title: list = None, doi: str = None, year: list = None,
                    sci_flag: bool = False, n_citation_flag: bool = False,
                    force_citation_sort: bool = False, force_year_sort: bool = False,
                    author_terms: list = None, org_terms: list = None,
                    size: int = 10, offset: int = 0) -> Any:
    """论文问答搜索（¥0.05/次）：AI 智能问答，支持自然语言和结构化关键词。"""
    body: dict = {"use_topic": use_topic, "size": size, "offset": offset}
    if query:
        body["query"] = query
    if topic_high:
        body["topic_high"] = topic_high
    if topic_middle:
        body["topic_middle"] = topic_middle
    if topic_low:
        body["topic_low"] = topic_low
    if title:
        body["title"] = title
    if doi:
        body["doi"] = doi
    if year:
        body["year"] = year
    if sci_flag:
        body["sci_flag"] = True
    if n_citation_flag:
        body["n_citation_flag"] = True
    if force_citation_sort:
        body["force_citation_sort"] = True
    if force_year_sort:
        body["force_year_sort"] = True
    if author_terms:
        body["author_terms"] = author_terms
    if org_terms:
        body["org_terms"] = org_terms
    return _request(token, "POST", "/api/paper/qa/search", body=body)


def paper_info(token: str, ids: list) -> Any:
    """论文信息（免费）：批量根据 ID 获取基础信息。"""
    return _request(token, "POST", "/api/paper/info", body={"ids": ids})


def paper_detail(token: str, paper_id: str) -> Any:
    """论文详情（¥0.01/次）：获取完整论文信息。"""
    return _request(token, "GET", "/api/paper/detail", params={"id": paper_id})


def paper_relation(token: str, paper_id: str) -> Any:
    """论文引用（¥0.10/次）：获取该论文引用的其他论文。"""
    return _request(token, "GET", "/api/paper/relation", params={"id": paper_id})


def paper_list_by_search_venue(token: str, keyword: str = None, venue: str = None,
                                author: str = None, order: str = None,
                                page: int = 0, size: int = 10) -> Any:
    """论文综合搜索（¥0.30/次）：通过关键词/期刊/作者获取完整论文信息。"""
    params = {"page": page, "size": size}
    for k, v in [("keyword", keyword), ("venue", venue), ("author", author), ("order", order)]:
        if v is not None:
            params[k] = v
    return _request(token, "GET", "/api/paper/list/by/search/venue", params=params)


def paper_list_by_keywords(token: str, keywords: list, page: int = 0, size: int = 10) -> Any:
    """论文批量查询（¥0.10/次）：多关键词获取论文摘要等信息。"""
    params = {"page": page, "size": size, "keywords": json.dumps(keywords, ensure_ascii=False)}
    return _request(token, "GET", "/api/paper/list/citation/by/keywords", params=params)


def paper_detail_by_condition(token: str, year: int, venue_id: str = None) -> Any:
    """按年份与期刊获取论文详情（¥0.20/次）：year 与 venue_id 须同时传入，仅传 year 返回 null。"""
    params: dict = {"year": year}
    if venue_id:
        params["venue_id"] = venue_id
    return _request(token, "GET",
                    "/api/paper/platform/allpubs/more/detail/by/ts/org/venue",
                    params=params)


# ──────────────────────────────────────────────────────────────────────────────
# 学者类 API
# ──────────────────────────────────────────────────────────────────────────────

def person_search(token: str, name: str = None, org: str = None,
                  org_id: list = None, offset: int = 0, size: int = 5) -> Any:
    """学者搜索（免费）：根据姓名/机构搜索学者。"""
    body: dict = {"offset": offset, "size": size}
    if name:
        body["name"] = name
    if org:
        body["org"] = org
    if org_id:
        body["org_id"] = org_id
    return _request(token, "POST", "/api/person/search", body=body)


def person_detail(token: str, person_id: str) -> Any:
    """学者详情（¥1.00/次）：获取完整个人信息。"""
    return _request(token, "GET", "/api/person/detail", params={"id": person_id})


def person_figure(token: str, person_id: str) -> Any:
    """学者画像（¥0.50/次）：获取研究兴趣、领域及结构化经历。"""
    return _request(token, "GET", "/api/person/figure", params={"id": person_id})


def person_paper_relation(token: str, person_id: str) -> Any:
    """学者论文（¥1.50/次）：获取学者发表的论文列表。"""
    return _request(token, "GET", "/api/person/paper/relation", params={"id": person_id})


def person_patent_relation(token: str, person_id: str) -> Any:
    """学者专利（¥1.50/次）：获取学者的专利列表。"""
    return _request(token, "GET", "/api/person/patent/relation", params={"id": person_id})


def person_project(token: str, person_id: str) -> Any:
    """学者项目（¥3.00/次）：获取科研项目（资助金额/时间/来源）。"""
    return _request(token, "GET", "/api/project/person/v3/open", params={"id": person_id})


# ──────────────────────────────────────────────────────────────────────────────
# 机构类 API
# ──────────────────────────────────────────────────────────────────────────────

def org_search(token: str, orgs: list) -> Any:
    """机构搜索（免费）：根据名称关键词搜索机构。"""
    return _request(token, "POST", "/api/organization/search", body={"orgs": orgs})


def org_detail(token: str, ids: list) -> Any:
    """机构详情（¥0.01/次）：根据机构 ID 获取详情。"""
    return _request(token, "POST", "/api/organization/detail", body={"ids": ids})


def org_person_relation(token: str, org_id: str, offset: int = 0) -> Any:
    """机构学者（¥0.50/次）：获取机构下的学者列表（每次 10 条）。"""
    return _request(token, "GET", "/api/organization/person/relation",
                    params={"org_id": org_id, "offset": offset})


def org_paper_relation(token: str, org_id: str, offset: int = 0) -> Any:
    """机构论文（¥0.10/次）：获取机构学者发表的论文列表（每次 10 条）。"""
    return _request(token, "GET", "/api/organization/paper/relation",
                    params={"org_id": org_id, "offset": offset})


def org_patent_relation(token: str, org_id: str,
                        page: int = 1, page_size: int = 100) -> Any:
    """机构专利（¥0.10/次）：获取机构拥有的专利列表，支持分页（page_size 最大 10000）。"""
    return _request(token, "GET", "/api/organization/patent/relation",
                    params={"id": org_id, "page": page, "page_size": page_size})


def org_disambiguate(token: str, org: str) -> Any:
    """机构消歧（¥0.01/次）：获取机构标准化名称。"""
    return _request(token, "POST", "/api/organization/na", body={"org": org})


def org_disambiguate_pro(token: str, org: str) -> Any:
    """机构消歧 pro（¥0.05/次）：提取一级和二级机构 ID。"""
    return _request(token, "POST", "/api/organization/na/pro", body={"org": org})


# ──────────────────────────────────────────────────────────────────────────────
# 期刊类 API
# ──────────────────────────────────────────────────────────────────────────────

def venue_search(token: str, name: str) -> Any:
    """期刊搜索（免费）：根据名称搜索期刊 ID 和标准名称。"""
    return _request(token, "POST", "/api/venue/search", body={"name": name})


def venue_detail(token: str, venue_id: str) -> Any:
    """期刊详情（¥0.20/次）：获取 ISSN、简称、类型等。"""
    return _request(token, "POST", "/api/venue/detail", body={"id": venue_id})


def venue_paper_relation(token: str, venue_id: str, offset: int = 0,
                         limit: int = 20, year: Optional[int] = None) -> Any:
    """期刊论文（¥0.10/次）：获取期刊论文列表（支持按年份筛选）。"""
    body: dict = {"id": venue_id, "offset": offset, "limit": limit}
    if year is not None:
        body["year"] = year
    return _request(token, "POST", "/api/venue/paper/relation", body=body)


# ──────────────────────────────────────────────────────────────────────────────
# 专利类 API
# ──────────────────────────────────────────────────────────────────────────────

def patent_search(token: str, query: str, page: int = 0, size: int = 10) -> Any:
    """专利搜索（免费）：根据名称/关键词搜索专利。"""
    return _request(token, "POST", "/api/patent/search",
                    body={"query": query, "page": page, "size": size})


def patent_info(token: str, patent_id: str) -> Any:
    """专利信息（免费）：获取专利基础信息（标题/专利号/发明人）。"""
    return _request(token, "GET", "/api/patent/info", params={"id": patent_id})


def patent_detail(token: str, patent_id: str) -> Any:
    """专利详情（¥0.01/次）：获取完整专利信息（摘要/申请日/IPC等）。"""
    return _request(token, "GET", "/api/patent/detail", params={"id": patent_id})


# ──────────────────────────────────────────────────────────────────────────────
# 组合工作流
# ──────────────────────────────────────────────────────────────────────────────

def workflow_scholar_profile(token: str, name: str) -> dict:
    """
    工作流 1：学者全景分析
    搜索学者 → 详情 + 画像 + 论文 + 专利 + 项目
    """
    print(f"[1/6] 搜索学者：{name}", file=sys.stderr)
    search_result = person_search(token, name=name, size=5)
    if not search_result or not search_result.get("data"):
        return {"error": f"未找到学者：{name}"}

    candidates = search_result["data"]
    scholar = candidates[0]
    person_id = scholar.get("id") or scholar.get("_id")
    print(f"      找到：{scholar.get('name')} ({scholar.get('org')})，ID={person_id}", file=sys.stderr)

    result = {
        "source_api_chain": [
            "person_search",
            "person_detail",
            "person_figure",
            "person_paper_relation",
            "person_patent_relation",
            "person_project",
        ],
        "search_candidates": candidates[:3],
        "selected": {
            "id": person_id,
            "name": scholar.get("name"),
            "name_zh": scholar.get("name_zh"),
            "org": scholar.get("org"),
            "interests": scholar.get("interests"),
            "n_citation": scholar.get("n_citation"),
        }
    }

    print("[2/6] 获取学者详情...", file=sys.stderr)
    detail = person_detail(token, person_id)
    if detail and detail.get("data"):
        result["detail"] = detail["data"]

    print("[3/6] 获取学者画像...", file=sys.stderr)
    figure = person_figure(token, person_id)
    if figure and figure.get("data"):
        result["figure"] = figure["data"]

    print("[4/6] 获取学者论文...", file=sys.stderr)
    papers = person_paper_relation(token, person_id)
    if papers and papers.get("data"):
        result["papers"] = papers["data"][:20]
        result["papers_total"] = papers.get("total", len(papers["data"]))

    print("[5/6] 获取学者专利...", file=sys.stderr)
    patents = person_patent_relation(token, person_id)
    if patents and patents.get("data"):
        result["patents"] = patents["data"][:10]

    print("[6/6] 获取学者项目...", file=sys.stderr)
    projects = person_project(token, person_id)
    if projects and projects.get("data"):
        result["projects"] = projects["data"][:10]

    return result


def workflow_paper_deep_dive(token: str, title: str = None, keyword: str = None,
                              author: str = None, order: str = "n_citation") -> dict:
    """
    工作流 2：论文深度挖掘
    搜索论文 → 详情 + 引用链 + 引用论文基础信息
    """
    print(f"[1/4] 搜索论文：title={title}, keyword={keyword}", file=sys.stderr)
    if keyword or author:
        search_result = paper_search_pro(token, title=title, keyword=keyword,
                                         author=author, order=order, size=5)
        search_api = "paper_search_pro"
    else:
        search_result = paper_search(token, title=title or keyword, size=5)
        search_api = "paper_search"
        if not search_result or not search_result.get("data"):
            # 标题检索无结果时，降级到 pro 检索，提高召回率
            print("      标题检索无结果，降级到 paper_search_pro...", file=sys.stderr)
            search_result = paper_search_pro(token, title=title, keyword=title,
                                             author=author, order=order, size=5)
            search_api = "paper_search_pro(fallback)"

    if not search_result or not search_result.get("data"):
        return {"error": "未找到相关论文"}

    papers = search_result["data"]
    top_paper = papers[0]
    paper_id = top_paper.get("id") or top_paper.get("_id")
    print(f"      找到：{top_paper.get('title')[:60]}，ID={paper_id}", file=sys.stderr)

    result = {
        "source_api_chain": [
            search_api,
            "paper_detail",
            "paper_relation",
            "paper_info",
        ],
        "search_candidates": papers[:5],
        "selected_id": paper_id,
        "selected_title": top_paper.get("title"),
    }

    print("[2/4] 获取论文详情...", file=sys.stderr)
    detail = paper_detail(token, paper_id)
    if detail and detail.get("data"):
        result["detail"] = detail["data"]

    print("[3/4] 获取引用关系...", file=sys.stderr)
    relation = paper_relation(token, paper_id)
    if relation and relation.get("data"):
        # data 结构：[{"_id": "<paper_id>", "cited": [{...}, ...]}]
        # 外层数组是以论文为单位的包装，真正的引用列表在 cited 字段里
        all_cited = []
        for item in relation["data"]:
            all_cited.extend(item.get("cited") or [])
        result["citations_count"] = len(all_cited)
        result["citations_preview"] = all_cited[:10]

        # 批量获取被引论文基础信息
        cited_ids = [c.get("_id") or c.get("id") for c in all_cited[:20]
                     if c.get("_id") or c.get("id")]
        if cited_ids:
            print(f"[4/4] 批量获取 {len(cited_ids)} 篇被引论文信息...", file=sys.stderr)
            info = paper_info(token, cited_ids)
            if info and info.get("data"):
                result["cited_papers_info"] = info["data"]
        else:
            print("[4/4] 跳过（无被引 ID）", file=sys.stderr)
    else:
        print("[4/4] 跳过（无引用数据）", file=sys.stderr)

    return result


def workflow_org_analysis(token: str, org: str) -> dict:
    """
    工作流 3：机构研究力分析
    机构消歧 pro → 详情 + 学者 + 论文 + 专利
    """
    print(f"[1/5] 机构消歧：{org}", file=sys.stderr)
    disamb = org_disambiguate_pro(token, org)
    org_id = None

    if disamb and disamb.get("data"):
        data = disamb["data"]
        if isinstance(data, list) and data:
            first = data[0]
            org_id = first.get("一级ID") or first.get("二级ID")
        elif isinstance(data, dict):
            org_id = data.get("一级ID") or data.get("二级ID")

    if not org_id:
        print("      消歧 pro 未返回 ID，尝试机构搜索...", file=sys.stderr)
        search_r = org_search(token, [org])
        if search_r and search_r.get("data"):
            orgs = search_r["data"]
            org_id = orgs[0].get("org_id") if orgs else None

    if not org_id:
        return {"error": f"无法找到机构 ID：{org}"}

    print(f"      机构 ID：{org_id}", file=sys.stderr)
    result = {
        "source_api_chain": [
            "org_disambiguate_pro",
            "org_detail",
            "org_person_relation",
            "org_paper_relation",
            "org_patent_relation",
        ],
        "org_query": org,
        "org_id": org_id,
        "disambiguate": disamb,
    }

    print("[2/5] 获取机构详情...", file=sys.stderr)
    detail = org_detail(token, [org_id])
    if detail and detail.get("data"):
        result["detail"] = detail["data"]

    print("[3/5] 获取机构学者（前10位）...", file=sys.stderr)
    scholars = org_person_relation(token, org_id, offset=0)
    if scholars and scholars.get("data"):
        result["scholars"] = scholars["data"]
        result["scholars_total"] = scholars.get("total", len(scholars["data"]))

    print("[4/5] 获取机构论文（前10篇）...", file=sys.stderr)
    papers = org_paper_relation(token, org_id, offset=0)
    if papers and papers.get("data"):
        result["papers"] = papers["data"]
        result["papers_total"] = papers.get("total", len(papers["data"]))

    print("[5/5] 获取机构专利（最多100条）...", file=sys.stderr)
    patents = org_patent_relation(token, org_id, page=1, page_size=100)
    if patents and patents.get("data"):
        result["patents"] = patents["data"]
        result["patents_total"] = patents.get("total", len(patents["data"]))

    return result


def workflow_venue_papers(token: str, venue: str, year: Optional[int] = None,
                           limit: int = 20) -> dict:
    """
    工作流 4：期刊论文监控
    期刊搜索 → 期刊详情 + 按年份获取论文列表
    """
    print(f"[1/3] 搜索期刊：{venue}", file=sys.stderr)
    search_result = venue_search(token, venue)
    if not search_result or not search_result.get("data"):
        return {"error": f"未找到期刊：{venue}"}

    venues = search_result["data"]
    top_venue = venues[0]
    venue_id = top_venue.get("id")
    print(f"      找到：{top_venue.get('name_en')}，ID={venue_id}", file=sys.stderr)
    result = {
        "source_api_chain": [
            "venue_search",
            "venue_detail",
            "venue_paper_relation",
        ],
        "search_candidates": venues[:3],
        "venue_id": venue_id,
    }

    print("[2/3] 获取期刊详情...", file=sys.stderr)
    detail = venue_detail(token, venue_id)
    if detail and detail.get("data"):
        result["venue_detail"] = detail["data"]

    print(f"[3/3] 获取期刊论文（year={year}, limit={limit}）...", file=sys.stderr)
    papers = venue_paper_relation(token, venue_id, year=year, limit=limit)
    if papers and papers.get("data"):
        result["papers"] = papers["data"]
        result["papers_total"] = papers.get("total", len(papers["data"]))

    return result


def workflow_paper_qa(token: str, query: str = None,
                      topic_high: str = None, topic_middle: str = None,
                      sci_flag: bool = False, sort_citation: bool = False,
                      size: int = 10) -> dict:
    """
    工作流 5：学术智能问答
    使用 AI 驱动的论文问答搜索接口
    """
    use_topic = topic_high is not None
    print(f"[1/1] 学术问答搜索：query={query}, use_topic={use_topic}", file=sys.stderr)
    qa_result = paper_qa_search(
        token, query=query, use_topic=use_topic,
        topic_high=topic_high, topic_middle=topic_middle,
        sci_flag=sci_flag, force_citation_sort=sort_citation,
        size=size
    )
    if qa_result and qa_result.get("code") == 200 and qa_result.get("data"):
        qa_result["source_api_chain"] = ["paper_qa_search"]
        qa_result["route"] = "paper_qa_search"
        return qa_result

    # query 模式无结果时，回退到 pro 检索
    if query:
        print("      paper_qa_search 无结果，降级到 paper_search_pro...", file=sys.stderr)
        fallback = paper_search_pro(token, keyword=query, order="n_citation", size=size)
        data = (fallback or {}).get("data") or []
        return {
            "code": 200 if data else (qa_result or {}).get("code", -1),
            "success": bool(data),
            "msg": "" if data else "no data",
            "data": data,
            "total": (fallback or {}).get("total", len(data)),
            "route": "paper_qa_search -> paper_search_pro",
            "source_api_chain": ["paper_qa_search", "paper_search_pro"],
            "primary_result": qa_result,
        }

    if isinstance(qa_result, dict):
        qa_result["source_api_chain"] = ["paper_qa_search"]
        qa_result["route"] = "paper_qa_search"
    return qa_result


def workflow_patent_search(token: str, query: str, page: int = 0, size: int = 10) -> dict:
    """
    工作流 6：专利搜索与详情
    专利搜索 → 获取每条专利的详情
    """
    print(f"[1/2] 搜索专利：{query}", file=sys.stderr)
    search_result = patent_search(token, query, page=page, size=size)
    if not search_result or not search_result.get("data"):
        return {"error": f"未找到专利：{query}"}

    patents = search_result["data"]
    result = {
        "source_api_chain": ["patent_search", "patent_detail"],
        "search_results": patents,
        "total": len(patents),
    }

    print(f"[2/2] 获取前 {min(3, len(patents))} 条专利详情...", file=sys.stderr)
    details = []
    for p in patents[:3]:
        pid = p.get("id")
        if pid:
            d = patent_detail(token, pid)
            if d and d.get("data"):
                details.append(d["data"])
    result["details"] = details
    return result


def workflow_scholar_patents(token: str, name: str) -> dict:
    """
    通过学者名获取其专利列表 + 每条专利详情
    """
    print(f"[1/3] 搜索学者：{name}", file=sys.stderr)
    search_result = person_search(token, name=name, size=3)
    if not search_result or not search_result.get("data"):
        return {"error": f"未找到学者：{name}"}

    scholar = search_result["data"][0]
    person_id = scholar.get("id")
    print(f"      找到：{scholar.get('name')}，ID={person_id}", file=sys.stderr)
    result = {"scholar": scholar}

    print("[2/3] 获取学者专利列表...", file=sys.stderr)
    patents = person_patent_relation(token, person_id)
    if not patents or not patents.get("data"):
        return {**result, "patents": [], "error": "该学者无专利数据"}
    patent_list = patents["data"]
    result["patents_list"] = patent_list

    print(f"[3/3] 获取前 {min(3, len(patent_list))} 条专利详情...", file=sys.stderr)
    details = []
    for p in patent_list[:3]:
        pid = p.get("patent_id")
        if pid:
            d = patent_detail(token, pid)
            if d and d.get("data"):
                details.append(d["data"])
    result["patent_details"] = details
    return result


# ──────────────────────────────────────────────────────────────────────────────
# 命令行入口
# ──────────────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="AMiner 开放平台学术数据查询客户端",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  # 学者全景分析
  python aminer_client.py --token <TOKEN> --action scholar_profile --name "Andrew Ng"

  # 论文深度挖掘
  python aminer_client.py --token <TOKEN> --action paper_deep_dive --title "BERT"
  python aminer_client.py --token <TOKEN> --action paper_deep_dive --keyword "large language model" --author "Hinton"

  # 机构研究力分析
  python aminer_client.py --token <TOKEN> --action org_analysis --org "Tsinghua University"

  # 期刊论文监控
  python aminer_client.py --token <TOKEN> --action venue_papers --venue "NeurIPS" --year 2023

  # 学术智能问答
  python aminer_client.py --token <TOKEN> --action paper_qa --query "蛋白质结构深度学习"
  python aminer_client.py --token <TOKEN> --action paper_qa \\
    --topic_high '[["transformer","self-attention"],["protein folding"]]' \\
    --sci_flag --sort_citation

  # 专利搜索
  python aminer_client.py --token <TOKEN> --action patent_search --query "量子计算芯片"

  # 学者专利
  python aminer_client.py --token <TOKEN> --action scholar_patents --name "张首晟"

  # 直接调用单个 API
  python aminer_client.py --token <TOKEN> --action raw \\
    --api paper_search --params '{"title":"BERT","page":0,"size":5}'

控制台（生成Token）：https://open.aminer.cn/open/board?tab=control
文档：https://open.aminer.cn/open/doc
        """
    )
    p.add_argument("--token", default=TEST_TOKEN,
                   help="AMiner API Token（前往 https://open.aminer.cn/open/board?tab=control 生成）")
    p.add_argument("--action", required=True,
                   choices=["scholar_profile", "paper_deep_dive", "org_analysis",
                            "venue_papers", "paper_qa", "patent_search",
                            "scholar_patents", "raw"],
                   help="执行的操作")

    # 通用参数
    p.add_argument("--name", help="学者姓名")
    p.add_argument("--title", help="论文标题")
    p.add_argument("--keyword", help="关键词")
    p.add_argument("--author", help="作者名")
    p.add_argument("--org", help="机构名称")
    p.add_argument("--venue", help="期刊名称")
    p.add_argument("--query", help="查询字符串（自然语言问答或专利搜索）")
    p.add_argument("--year", type=int, help="年份筛选")
    p.add_argument("--size", type=int, default=10, help="返回条数")
    p.add_argument("--page", type=int, default=0, help="页码")
    p.add_argument("--page_size", type=int, default=100,
                   help="机构专利分页条数（最大 10000）")
    p.add_argument("--order", default="n_citation",
                   choices=["n_citation", "year"], help="排序方式")

    # 论文问答专用
    p.add_argument("--topic_high", help="必须匹配的关键词数组（JSON字符串，外层AND内层OR）")
    p.add_argument("--topic_middle", help="大幅加分关键词（格式同 topic_high）")
    p.add_argument("--sci_flag", action="store_true", help="只返回 SCI 论文")
    p.add_argument("--sort_citation", action="store_true", help="按引用量排序")

    # raw 模式
    p.add_argument("--api", help="[raw模式] API 函数名，如 paper_search")
    p.add_argument("--params", help="[raw模式] JSON 格式的参数字典")

    return p


def main():
    parser = build_parser()
    args = parser.parse_args()
    token = args.token

    if args.action == "scholar_profile":
        if not args.name:
            parser.error("--action scholar_profile 需要 --name 参数")
        result = workflow_scholar_profile(token, args.name)

    elif args.action == "paper_deep_dive":
        if not args.title and not args.keyword:
            parser.error("--action paper_deep_dive 需要 --title 或 --keyword 参数")
        result = workflow_paper_deep_dive(
            token, title=args.title, keyword=args.keyword,
            author=args.author, order=args.order
        )

    elif args.action == "org_analysis":
        if not args.org:
            parser.error("--action org_analysis 需要 --org 参数")
        result = workflow_org_analysis(token, args.org)

    elif args.action == "venue_papers":
        if not args.venue:
            parser.error("--action venue_papers 需要 --venue 参数")
        result = workflow_venue_papers(token, args.venue, year=args.year, limit=args.size)

    elif args.action == "paper_qa":
        if not args.query and not args.topic_high:
            parser.error("--action paper_qa 需要 --query 或 --topic_high 参数")
        result = workflow_paper_qa(
            token, query=args.query,
            topic_high=args.topic_high, topic_middle=args.topic_middle,
            sci_flag=args.sci_flag, sort_citation=args.sort_citation,
            size=args.size
        )

    elif args.action == "patent_search":
        if not args.query:
            parser.error("--action patent_search 需要 --query 参数")
        result = workflow_patent_search(token, args.query, page=args.page, size=args.size)

    elif args.action == "scholar_patents":
        if not args.name:
            parser.error("--action scholar_patents 需要 --name 参数")
        result = workflow_scholar_patents(token, args.name)

    elif args.action == "raw":
        if not args.api:
            parser.error("--action raw 需要 --api 参数（API 函数名）")
        fn = globals().get(args.api)
        if fn is None or not callable(fn):
            parser.error(f"未找到 API 函数：{args.api}。可用函数请查看源码。")
        kwargs = json.loads(args.params) if args.params else {}
        result = fn(token, **kwargs)

    else:
        parser.print_help()
        sys.exit(1)

    _print(result)


if __name__ == "__main__":
    main()
