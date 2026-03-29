# AMiner 开放平台 API 完整参考手册

**基础域名**：`https://datacenter.aminer.cn/gateway/open_platform`  
**认证方式**：所有接口在请求头中携带 `Authorization: <TOKEN>`  
**Token 获取**：登录 [控制台](https://open.aminer.cn/open/board?tab=control) 生成，在下方所有 curl 示例中将 `<TOKEN>` 替换为你的实际 Token。

---

## 目录

- [论文类 API（9个）](#论文类-api)
- [学者类 API（6个）](#学者类-api)
- [机构类 API（7个）](#机构类-api)
- [期刊类 API（3个）](#期刊类-api)
- [专利类 API（3个）](#专利类-api)

---

## 论文类 API

### 1. 论文搜索

- **URL**：`GET /api/paper/search`
- **价格**：免费
- **说明**：根据论文标题搜索，返回论文 ID、标题、DOI

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 是 | 页码（从 0 开始，最大为 0） |
| size | number | 否 | 每页条数 |
| title | string | 是 | 论文标题关键词 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 论文 ID |
| title | 论文英文标题 |
| title_zh | 论文中文标题 |
| doi | DOI |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/search?page=0&size=5&title=BERT' \
  -H 'Authorization: <TOKEN>'
```

---

### 2. 论文搜索 pro

- **URL**：`GET /api/paper/search/pro`
- **价格**：¥0.01/次
- **说明**：多条件搜索，支持关键词、摘要、作者、机构、期刊等过滤

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页数（从 0 开始） |
| size | number | 否 | 每页条数 |
| title | string | 否 | 标题关键词 |
| keyword | string | 否 | 关键词 |
| abstract | string | 否 | 摘要关键词 |
| author | string | 否 | 作者名 |
| org | string | 否 | 机构名 |
| venue | string | 否 | 期刊名 |
| order | string | 否 | 排序字段：`year`（年份降序）或 `n_citation`（引用量降序），不传为综合排序 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 论文 ID |
| title | 英文标题 |
| title_zh | 中文标题 |
| doi | DOI |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/search/pro?title=transformer&author=Vaswani&order=n_citation&page=0&size=5' \
  -H 'Authorization: <TOKEN>'
```

---

### 3. 论文问答搜索

- **URL**：`POST /api/paper/qa/search`
- **价格**：¥0.05/次
- **说明**：AI 智能问答搜索，支持自然语言提问和结构化关键词联合搜索

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| use_topic | boolean | 是 | 是否使用联合关键词搜索。`true` 时使用 topic 字段，`false` 时使用 title/query |
| topic_high | string | 否 | use_topic=true 时有效，必须匹配的关键词（AND 逻辑），嵌套数组格式：`[["词A","词B"],["词C"]]` 外层 AND，内层 OR |
| topic_middle | string | 否 | 大幅加分词，格式同 topic_high |
| topic_low | string | 否 | 小幅加分词，格式同 topic_high |
| title | []string | 否 | use_topic=false 时的标题查询 |
| doi | string | 否 | DOI 精确查询 |
| year | []number | 否 | 年份筛选数组 |
| sci_flag | boolean | 否 | 是否只返回 SCI 论文 |
| n_citation_flag | boolean | 否 | 是否对高引用量论文加分 |
| size | number | 否 | 返回数量（最大值） |
| offset | number | 否 | 偏移量 |
| force_citation_sort | boolean | 否 | 完全按照引用量排序 |
| force_year_sort | boolean | 否 | 完全按照年份排序 |
| author_terms | []string | 否 | 作者名查询，数组内为 OR 关系，建议多写变体 |
| org_terms | []string | 否 | 机构名查询，数组内为 OR 关系 |
| query | string | 否 | 自然语言原始问题（较慢），系统自动拆解关键词。与 topic_high 同时传时以此参数为准 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| data | 论文 ID 列表 |
| id | 论文 ID |
| title | 论文标题 |
| title_zh | 中文标题 |
| doi | DOI |
| Total / total | 总数 |

**curl 示例（自然语言问答）：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/qa/search' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"use_topic": false, "query": "深度学习蛋白质结构预测", "size": 10, "sci_flag": true}'
```

**curl 示例（结构化关键词）：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/qa/search' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{
    "use_topic": true,
    "topic_high": "[[\\"transformer\\",\\"self-attention\\"],[\\"protein folding\\"]]",
    "topic_middle": "[[\"AlphaFold\"]]",
    "sci_flag": true,
    "force_citation_sort": true,
    "size": 10
  }'
```

---

### 4. 论文信息

- **URL**：`POST /api/paper/info`
- **价格**：免费
- **说明**：批量根据论文 ID 获取基础信息（标题、卷号、期刊、作者）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | []string | 是 | 论文 ID 数组 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| _id | 论文 ID |
| title | 论文标题 |
| authors | 作者列表（含 name/name_zh） |
| issue | 卷号 |
| raw | 期刊名称 |
| venue | 期刊信息对象 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/info' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"ids": ["53e9ab9bb7602d97023e53b2", "53e9a98eb7602d9703e42e5a"]}'
```

---

### 5. 论文详情

- **URL**：`GET /api/paper/detail`
- **价格**：¥0.01/次
- **说明**：根据论文 ID 获取完整详情

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 论文 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 论文 ID |
| title | 英文标题 |
| title_zh | 中文标题 |
| abstract | 摘要 |
| abstract_zh | 中文摘要 |
| authors | 作者列表（name/name_zh/org/org_zh） |
| doi | DOI |
| issn | ISSN |
| issue | 卷号 |
| volume | 期 |
| year | 年份 |
| keywords | 关键词 |
| keywords_zh | 中文关键词 |
| raw | 期刊名称 |
| venue | 期刊信息对象 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/detail?id=53e9ab9bb7602d97023e53b2' \
  -H 'Authorization: <TOKEN>'
```

---

### 6. 论文引用

- **URL**：`GET /api/paper/relation`
- **价格**：¥0.10/次
- **说明**：根据论文 ID 获取该论文引用的论文列表

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 论文 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| _id | 论文 ID |
| title | 标题 |
| cited | 该论文引用的其他论文基础信息 |
| n_citation | 被引用次数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/relation?id=53e9ab9bb7602d97023e53b2' \
  -H 'Authorization: <TOKEN>'
```

---

### 7. 论文搜索接口（综合搜索）

- **URL**：`GET /api/paper/list/by/search/venue`
- **价格**：¥0.30/次
- **说明**：通过关键词或作者或期刊名称获取论文完整信息（含摘要、机构、期刊详情）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 是 | 页码数 |
| size | number | 是 | 每页条数 |
| keyword | string | 否 | 关键词（与 venue/author 三选一） |
| venue | string | 否 | 期刊名称（与 keyword/author 三选一） |
| author | string | 否 | 作者名称（与 keyword/venue 三选一） |
| order | string | 否 | 排序：`year` 或 `n_citation`，不传为综合排序 |

**响应字段（主要）：**

| 字段名 | 说明 |
|--------|------|
| _id | 论文 ID |
| title / title_zh | 论文标题（中英文） |
| abstract / abstract_zh | 摘要（中英文） |
| authors | 作者信息（含机构 ID、别名、详情） |
| venue | 期刊信息（中英文名、别名） |
| venue_hhb_id | 期刊 ID |
| keywords / keywords_zh | 关键词（中英文） |
| year | 发表年份 |
| n_citation | 引用量 |
| doi | DOI |
| url | 论文跳转地址 |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/list/by/search/venue?keyword=graph+neural+network&page=0&size=10&order=n_citation' \
  -H 'Authorization: <TOKEN>'
```

---

### 8. 论文批量查询（多关键词）

- **URL**：`GET /api/paper/list/citation/by/keywords`
- **价格**：¥0.10/次
- **说明**：通过多关键词获取论文关键词、摘要等信息

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 是 | 页码数 |
| size | number | 是 | 每页条数 |
| keywords | string | 是 | 关键词数组（JSON 字符串格式） |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 论文 ID |
| title / title_zh | 标题（中英文） |
| abstract / abstract_zh | 摘要（中英文） |
| keywords / keywords_zh | 关键词（中英文） |
| doi | DOI |
| year | 年份 |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/list/citation/by/keywords?page=0&size=10&keywords=%5B%22deep+learning%22%2C%22object+detection%22%5D' \
  -H 'Authorization: <TOKEN>'
```

---

### 9. 按年份与期刊获取论文详情

- **URL**：`GET /api/paper/platform/allpubs/more/detail/by/ts/org/venue`
- **价格**：¥0.20/次
- **说明**：根据论文发表年份与期刊获取论文标题、作者、DOI、关键词等详情

> **注意**：`venue_id` 与 `year` 须同时传入，仅传 `year` 接口返回 `null`。可先通过**期刊搜索**接口获取 `venue_id`。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| year | number | 是 | 论文发表年份 |
| venue_id | string | 是 | 期刊 ID（通过期刊搜索接口获取；不传返回 null） |

**响应字段（主要）：**

| 字段名 | 说明 |
|--------|------|
| _id | 论文 ID |
| title / title_zh | 标题（中英文） |
| abstract | 摘要 |
| authors | 作者数组（name/org/email/homepage/orc_id/`_id`） |
| doi | DOI |
| issn | ISSN |
| keywords / keywords_zh | 关键词（中英文） |
| year | 年份 |
| venue | 期刊信息 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/paper/platform/allpubs/more/detail/by/ts/org/venue?year=2023&venue_id=<VENUE_ID>' \
  -H 'Authorization: <TOKEN>'
```

---

## 学者类 API

### 10. 学者搜索

- **URL**：`POST /api/person/search`
- **价格**：免费
- **说明**：根据姓名（或机构）搜索学者，返回 ID、姓名、机构

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 学者姓名 |
| org | string | 否 | 机构名 |
| org_id | []string | 否 | 机构实体 ID 数组 |
| offset | number | 否 | 起始位置（最大为 0） |
| size | number | 否 | 返回条数（最大 10） |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 学者 ID |
| name | 英文姓名 |
| name_zh | 中文姓名 |
| org | 英文机构 |
| org_zh | 中文机构 |
| org_id | 机构 ID |
| interests | 研究兴趣 |
| n_citation | 引用量 |
| total | 总数 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/person/search' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"name": "Andrew Ng", "size": 5}'
```

---

### 11. 学者详情

- **URL**：`GET /api/person/detail`
- **价格**：¥1.00/次
- **说明**：根据学者 ID 获取完整个人信息

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 学者 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id / person_id | 学者 ID |
| name / name_zh | 姓名（中英文） |
| bio / bio_zh | 个人简介（中英文，不同时存在） |
| edu / edu_zh | 教育经历（中英文） |
| orgs / org_zhs | 机构列表（英文/中文） |
| position / position_zh | 职称（中英文） |
| domain | 研究领域 |
| honor | 荣誉 |
| award | 奖项 |
| year | 年份 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/person/detail?id=53f3ae78dabfae4b34b0c75d' \
  -H 'Authorization: <TOKEN>'
```

---

### 12. 学者画像

- **URL**：`GET /api/person/figure`
- **价格**：¥0.50/次
- **说明**：获取研究兴趣、领域及结构化工作/教育经历

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 学者 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 学者 ID |
| ai_interests | 研究兴趣列表 |
| ai_domain | 研究领域列表 |
| edus | 结构化教育经历 |
| works | 结构化工作经历 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/person/figure?id=53f3ae78dabfae4b34b0c75d' \
  -H 'Authorization: <TOKEN>'
```

---

### 13. 学者论文

- **URL**：`GET /api/person/paper/relation`
- **价格**：¥1.50/次
- **说明**：获取学者发表的论文列表（ID + 标题）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 学者 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| author_id | 学者 ID |
| id | 论文 ID |
| title | 论文标题 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/person/paper/relation?id=53f3ae78dabfae4b34b0c75d' \
  -H 'Authorization: <TOKEN>'
```

---

### 14. 学者专利

- **URL**：`GET /api/person/patent/relation`
- **价格**：¥1.50/次
- **说明**：获取学者相关的专利列表

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 学者 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| patent_id | 专利 ID |
| person_id | 学者 ID |
| title | 专利标题 |
| en | 英文标题 |
| zh | 中文标题 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/person/patent/relation?id=53f3ae78dabfae4b34b0c75d' \
  -H 'Authorization: <TOKEN>'
```

---

### 15. 学者项目

- **URL**：`GET /api/project/person/v3/open`
- **价格**：¥3.00/次
- **说明**：获取学者参与的科研项目（资助金额、时间、来源）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 否 | 学者 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 项目 ID |
| titles | 项目标题 |
| country | 国家 |
| project_source | 项目来源 |
| fund_amount | 资助金额 |
| fund_currency | 资助货币 |
| start_date | 开始时间 |
| end_date | 结束时间 |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/project/person/v3/open?id=53f3ae78dabfae4b34b0c75d' \
  -H 'Authorization: <TOKEN>'
```

---

## 机构类 API

### 16. 机构搜索

- **URL**：`POST /api/organization/search`
- **价格**：免费
- **说明**：根据名称关键词搜索机构 ID 和名称

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orgs | []string | 否 | 机构名称数组 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| org_id | 机构 ID |
| org_name | 机构名称 |
| total | 总数 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/search' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"orgs": ["Tsinghua University"]}'
```

---

### 17. 机构详情

- **URL**：`POST /api/organization/detail`
- **价格**：¥0.01/次
- **说明**：根据机构 ID 获取详情

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | []string | 是 | 机构 ID 数组 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 机构 ID |
| name / name_en / name_zh | 机构名（原始/英文/中文） |
| acronyms | 简称 |
| aliases | 别名列表 |
| details | 机构详细描述 |
| type | 机构类型（大学/企业等） |
| location | 地理位置 |
| language | 语言 |
| total | 总数 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/detail' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"ids": ["5f71b2091c455f439fe9a7d7"]}'
```

---

### 18. 机构学者

- **URL**：`GET /api/organization/person/relation`
- **价格**：¥0.50/次
- **说明**：获取机构下的学者列表（每次返回 10 条）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| org_id | string | 否 | 机构 ID |
| offset | number | 否 | 起始位置（每次固定返回 10 条） |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 学者 ID |
| name / name_zh | 学者姓名（中英文） |
| org / org_zh | 机构（中英文） |
| org_id | 机构 ID |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/person/relation?org_id=5f71b2091c455f439fe9a7d7&offset=0' \
  -H 'Authorization: <TOKEN>'
```

---

### 19. 机构论文

- **URL**：`GET /api/organization/paper/relation`
- **价格**：¥0.10/次
- **说明**：获取机构学者发表过的论文列表（每次返回 10 条）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| org_id | string | 是 | 机构 ID |
| offset | number | 是 | 起始位置（每次固定返回 10 条） |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 论文 ID |
| title / title_zh | 标题（中英文） |
| doi | DOI |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/paper/relation?org_id=5f71b2091c455f439fe9a7d7&offset=0' \
  -H 'Authorization: <TOKEN>'
```

---

### 20. 机构专利

- **URL**：`GET /api/organization/patent/relation`
- **价格**：¥0.10/次
- **说明**：获取机构拥有的专利 ID 列表，支持分页，单次最多返回 10000 条

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 机构 ID |
| page | number | 否 | 页码（从 1 开始） |
| page_size | number | 否 | 每页条数，最大 10000 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 专利 ID |
| total | 总数 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/patent/relation?id=6233173d0a6eb145604733e2&page=1&page_size=100' \
  -H 'Authorization: <TOKEN>'
```

---

### 21. 机构消歧

- **URL**：`POST /api/organization/na`
- **价格**：¥0.01/次
- **说明**：根据机构字符串（含缩写/别名）获取标准化机构名称

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| org | string | 是 | 机构名称（可含别名/缩写） |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| org_name | 归一化机构名称 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/na' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"org": "MIT CSAIL"}'
```

---

### 22. 机构消歧 pro

- **URL**：`POST /api/organization/na/pro`
- **价格**：¥0.05/次
- **说明**：从机构字符串中提取一级机构和二级机构的 ID（推荐用于工作流）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| org | string | 是 | 机构名称 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| 一级 | 一级机构名称 |
| 一级ID | 一级机构 ID |
| 二级 | 二级机构名称 |
| 二级ID | 二级机构 ID |
| Total / total | 总数 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/organization/na/pro' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"org": "Department of Computer Science, Tsinghua University"}'
```

---

## 期刊类 API

### 23. 期刊搜索

- **URL**：`POST /api/venue/search`
- **价格**：免费
- **说明**：根据期刊名称搜索期刊 ID 和标准名称

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 期刊名称（支持模糊搜索） |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 期刊 ID |
| name_en | 期刊英文名称 |
| name_zh | 期刊中文名称 |
| total | 总数 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/venue/search' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"name": "NeurIPS"}'
```

---

### 24. 期刊详情

- **URL**：`POST /api/venue/detail`
- **价格**：¥0.20/次
- **说明**：根据期刊 ID 获取 ISSN、简称、类型等详情

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 期刊 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 期刊 ID |
| name / name_en / name_zh | 名称（原始/英文/中文） |
| issn | ISSN |
| eissn | EISSN |
| alias | 别名 |
| type | 期刊类型 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/venue/detail' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"id": "<VENUE_ID>"}'
```

---

### 25. 期刊论文

- **URL**：`POST /api/venue/paper/relation`
- **价格**：¥0.10/次
- **说明**：根据期刊 ID 获取论文列表（支持按年份筛选）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 期刊 ID |
| offset | number | 否 | 起始位置 |
| limit | number | 否 | 返回条数 |
| year | number | 否 | 按年份筛选 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 论文 ID |
| title | 论文标题 |
| year | 年份 |
| offset | 当前偏移量 |
| total | 总数 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/venue/paper/relation' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"id": "<VENUE_ID>", "year": 2023, "offset": 0, "limit": 20}'
```

---

## 专利类 API

### 26. 专利搜索

- **URL**：`POST /api/patent/search`
- **价格**：免费
- **说明**：根据专利名称/关键词搜索专利

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| query | string | 是 | 查询字段（专利标题/关键词） |
| page | number | 是 | 页数 |
| size | number | 是 | 每页展示条数 |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 专利 ID |
| title | 专利英文标题 |
| title_zh | 专利中文标题 |

**curl 示例：**
```bash
curl -X POST \
  'https://datacenter.aminer.cn/gateway/open_platform/api/patent/search' \
  -H 'Content-Type: application/json;charset=utf-8' \
  -H 'Authorization: <TOKEN>' \
  -d '{"query": "量子计算芯片", "page": 0, "size": 10}'
```

---

### 27. 专利信息

- **URL**：`GET /api/patent/info`
- **价格**：免费
- **说明**：根据专利 ID 获取基础信息（标题、专利号、发明人、国家）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 专利 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 专利 ID |
| title / en | 专利标题（英文） |
| app_num | 申请号 |
| pub_num | 发布号 |
| pub_kind | 发布类型 |
| inventor | 发明人 |
| country | 国家 |
| sequence | 顺序 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/patent/info?id=<PATENT_ID>' \
  -H 'Authorization: <TOKEN>'
```

---

### 28. 专利详情

- **URL**：`GET /api/patent/detail`
- **价格**：¥0.01/次
- **说明**：根据专利 ID 获取完整详情（含摘要、申请日、受让人、IPC 分类等）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 专利 ID |

**响应字段：**

| 字段名 | 说明 |
|--------|------|
| id | 专利 ID |
| title | 专利标题 |
| abstract | 摘要 |
| app_date | 申请日期 |
| app_num | 申请号 |
| pub_date | 公开日期 |
| pub_num | 公开号 |
| pub_kind | 公开类型 |
| assignee | 受让人 |
| inventor | 发明人 |
| country | 国别 |
| ipc | IPC 分类号 |
| ipcr | IPCR 分类号 |
| cpc | CPC 分类号 |
| priority | 优先权信息 |
| description | 说明书 |

**curl 示例：**
```bash
curl -X GET \
  'https://datacenter.aminer.cn/gateway/open_platform/api/patent/detail?id=<PATENT_ID>' \
  -H 'Authorization: <TOKEN>'
```

---

## 附录：API 价格汇总

| 类别 | 免费接口 | 收费接口 |
|------|---------|---------|
| 论文 | 论文搜索、论文信息 | 论文搜索pro(¥0.01)、论文详情(¥0.01)、论文引用(¥0.10)、论文问答搜索(¥0.05)、论文搜索接口(¥0.30)、论文批量查询(¥0.10)、按条件获取(¥0.20) |
| 学者 | 学者搜索 | 学者详情(¥1.00)、学者画像(¥0.50)、学者论文(¥1.50)、学者专利(¥1.50)、学者项目(¥3.00) |
| 机构 | 机构搜索 | 机构详情(¥0.01)、机构学者(¥0.50)、机构论文(¥0.10)、机构专利(¥0.10)、机构消歧(¥0.01)、机构消歧pro(¥0.05) |
| 期刊 | 期刊搜索 | 期刊详情(¥0.20)、期刊论文(¥0.10) |
| 专利 | 专利搜索、专利信息 | 专利详情(¥0.01) |
