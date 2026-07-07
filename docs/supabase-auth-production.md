# Supabase Auth Production Setup

PAQ 使用 Supabase Auth 做登入、註冊、重設密碼與 workspace RLS。Production 前請先完成 Supabase URL Configuration，避免登入後導回 localhost 或產生重複 locale path。

## URL Configuration

Supabase Dashboard:

```text
Authentication -> URL Configuration
```

Site URL 設 production 網域：

```text
https://YOUR-PRODUCTION-DOMAIN
```

Additional Redirect URLs 至少加入：

```text
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
https://YOUR-VERCEL-PREVIEW-URL/auth/callback
https://YOUR-PRODUCTION-DOMAIN/auth/callback
```

若使用多個 preview domain，請依 Supabase Redirect URLs 文件使用允許的 wildcard pattern，並只放可信任 preview pattern。

## Auth Callback Rules

應維持單一 callback route：

```text
/auth/callback
```

登入、註冊、重設密碼後再由 app 內部 redirect 到 locale route，例如：

```text
/zh-TW/dashboard
/en/dashboard
```

避免把 locale 同時放在 Supabase callback 與 app redirect 兩邊，否則可能出現：

```text
/zh-TW/zh-TW/dashboard
```

## Local Smoke

本機 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

測試：

1. `/zh-TW/signup` 建立測試帳號。
2. 若啟用 email confirmation，到信箱點確認。
3. `/zh-TW/login` 登入。
4. 進 `/zh-TW/products/new` 建立產品。
5. 確認 cloud draft 與 report 可以保存。

## Production Smoke

Production 部署後測：

1. 註冊新 user A。
2. Email confirmation link 應回 production domain。
3. Login 後進 dashboard。
4. Reset password link 應回 production domain。
5. user A / user B 資料隔離仍成立。

## Email Confirmation And SMTP

Supabase built-in email provider 適合 demo，不適合 production 大量註冊或測試。官方 rate limit 文件列出 built-in email provider 對觸發 email 的 Auth endpoint 有很低的 project-wide 限制，且只能透過 custom SMTP 調整。

Production 建議：

1. 設定 custom SMTP。
2. 使用正式寄件網域與 SPF/DKIM/DMARC。
3. 在大量測試或發表前先與 email provider 調整 rate limit。
4. 建立測試帳號時不要重複使用正式使用者密碼。

## RLS Check

Auth 完成後確認：

```text
profiles
products
product_drafts
launch_reports
report_translations
workspace_events
```

每張 workspace 表都要啟用 RLS。一般使用者只能讀寫自己的 `auth.uid()` rows。不要建立 `allow all` policy。

## Source Notes

- Supabase Redirect URLs：https://supabase.com/docs/guides/auth/redirect-urls
- Supabase wrong redirect troubleshooting：https://supabase.com/docs/guides/troubleshooting/why-am-i-being-redirected-to-the-wrong-url-when-using-auth-redirectto-option-_vqIeO
- Supabase Auth rate limits：https://supabase.com/docs/guides/auth/rate-limits
- Supabase custom SMTP：https://supabase.com/docs/guides/auth/auth-smtp
