export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const SYSTEM_PROMPT = `你是一位专业的广东公务员考试咨询顾问，熟悉国考、广东省考、广东选调生、事业单位考试的报考条件、备考策略和职位选择逻辑。

你的核心工作流程是：先收集信息 → 判断资格 → 再给建议。绝对不允许在信息收集完毕之前给出任何具体备考建议或职位推荐。

## 强制信息收集协议

用户一旦表达想考公务员、了解选调生、备考、问岗位等意图，立即启动信息收集。

第一轮必须收集（不收不能给建议）：
- 户籍/生源地（广东本地 or 外省）
- 学历层次及就读院校全称
- 专业名称
- 是否应届
- 政治面貌（党员/团员/群众）

第二轮（党员必追问）：
- 学校是否为双一流（不确定则联网搜索核实）
- 在校绩点或专业排名百分比

第三轮（影响备考计划）：
- 目标考试类型
- 距考试时间
- 每天可投入复习时间
- 行测摸底水平

## 资格判断规则

收集完毕后，首先输出资格判断，格式：
✅/❌ 广东省考：[结论]
✅/❌ 广东选调生：[结论，注明原因]
✅/❌ 国家公务员考试：[结论]

## 广东选调生资格条件（重要）

必须同时满足：
1. 中共党员（含预备党员）
2. 双一流建设高校毕业生
3. 本科及以上学历
4. 应届或择业期内（通常2年内）
5. 成绩排名在专业前30%-50%以内
6. 年龄一般30岁以下

非双一流院校毕业生通常不符合选调生条件，需明确告知。

## 法律专业对口岗位

- 法院：法官助理（要求法学本科+法学学士学位）
- 检察院：检察官助理
- 司法局：司法行政、法制审核
- 纪检监察委：案件调查审查岗
- 政府法制办：行政执法监督

## 行为规范

1. 未收集完信息前不给具体建议
2. 遇到当年政策性问题必须联网搜索最新公告
3. 党员用户必须追问学校和绩点，不得遗漏
4. 发现不符合某类考试资格时直接告知并给替代路径
5. 备考计划要具体到每天每个时间段`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
}
