// OpenRouter APIを使用して評価コメントを取得するモジュール
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// APIキーを読み込む関数
function getApiKey() {
  try {
    const apiKeyPath = path.join(__dirname, "openrouter.apikey");
    return fs.readFileSync(apiKeyPath, "utf8").trim();
  } catch (error) {
    console.error("APIキーの読み込みに失敗しました:", error.message);
    return null;
  }
}

// スコアに基づいた評価コメントをOpenRouter APIから取得する
async function getScoreEvaluation(score) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      success: false,
      message: "OpenRouter APIキーが見つかりません。",
      evaluation: "すごい！ " + score + "点を獲得しました！",
    };
  }

  try {
    // 最高スコアを3300点として、達成率を計算
    const achievementRate = Math.round((score / 3300) * 100);

    const prompt = `
あなたはどんどんぱっというリズムゲームの評価者です。
プレイヤーは「どん」「どん」「ぱっ」のリズムに合わせてマットを踏むゲームをプレイしました。
プレイヤーの最終スコアは${score}点です（理論上の最高点は3300点で、達成率は約${achievementRate}%）。

プレイヤーに対して、以下の条件を満たす前向きな評価コメントを1つだけ作成してください：
- 50文字以内で簡潔に
- 励ましになる前向きな内容
- スコアに応じた適切な評価（高得点なら称賛、低得点でも励ましを）
- 日本語で
- 絵文字は使わない

評価コメントのみを出力してください。
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたはゲームの評価を行う日本語アシスタントです。",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Dondonpa Game",
        },
      }
    );

    const evaluation = response.data.choices[0].message.content.trim();

    return {
      success: true,
      evaluation,
    };
  } catch (error) {
    console.error("OpenRouter APIエラー:", error.message);

    // APIエラー時のフォールバックメッセージ
    return {
      success: false,
      message: "API呼び出しに失敗しました: " + error.message,
      evaluation: `素晴らしい！${score}点を獲得しました！`,
    };
  }
}

module.exports = {
  getScoreEvaluation,
};
