import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PROXY_SECRET = process.env.PROXY_SECRET || "";

app.get("/", (req, res) => {
  res.send("Server đang hoạt động");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    telegramConfigured: Boolean(BOT_TOKEN && CHAT_ID)
  });
});

app.post("/api/telegram/send", async (req, res) => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(503).json({
        ok: false,
        error: "Telegram chưa được cấu hình trên backend"
      });
    }

    if (
      PROXY_SECRET &&
      req.headers["x-proxy-secret"] !== PROXY_SECRET
    ) {
      return res.status(401).json({
        ok: false,
        error: "Proxy secret không hợp lệ"
      });
    }

    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "Nội dung tin nhắn đang bị thiếu"
      });
    }

    const telegramUrl =
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text
      })
    });

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      return res.status(502).json({
        ok: false,
        error: "Telegram từ chối yêu cầu"
      });
    }

    return res.json({
      ok: true,
      message: "Đã gửi tin nhắn Telegram"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Lỗi xử lý backend"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});