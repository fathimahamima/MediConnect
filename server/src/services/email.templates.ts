function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[char] || char
  })
}

interface TemplateOptions {
  category: string
  title: string
  message: string
  buttonText?: string
  buttonUrl?: string
  notice?: string
}

export function emailTemplate(
  options: TemplateOptions
) {
  const button =
    options.buttonText && options.buttonUrl
      ? `
        <div style="margin:30px 0">
          <a
            href="${escapeHtml(options.buttonUrl)}"
            style="
              display:inline-block;
              background:#4f46e5;
              color:#ffffff;
              padding:15px 26px;
              border-radius:10px;
              text-decoration:none;
              font-weight:600;
            "
          >
            ${escapeHtml(options.buttonText)}
          </a>
        </div>
      `
      : ''

  return `
    <!DOCTYPE html>
    <html>
      <body style="
        margin:0;
        padding:24px;
        background:#edf1f7;
        font-family:Arial,sans-serif;
        color:#0f172a;
      ">

        <div style="
          max-width:600px;
          margin:auto;
          background:#ffffff;
          border-radius:18px;
          overflow:hidden;
        ">

          <div style="
            background:#080f26;
            padding:38px 24px;
            text-align:center;
            color:#ffffff;
          ">
            <div style="
              font-size:30px;
              font-weight:800;
              letter-spacing:-1px;
            ">
              MediConnect
            </div>

            <p style="
              font-size:11px;
              color:#a5b4fc;
              letter-spacing:2px;
            ">
              CONNECTED CARE. REIMAGINED.
            </p>
          </div>

          <div style="padding:32px">

            <p style="
              font-size:11px;
              color:#4f46e5;
              font-weight:bold;
              letter-spacing:1px;
            ">
              ${escapeHtml(options.category)}
            </p>

            <h1 style="
              font-size:27px;
              line-height:1.35;
              margin:18px 0;
            ">
              ${escapeHtml(options.title)}
            </h1>

            <p style="
              font-size:15px;
              line-height:1.8;
              color:#475569;
            ">
              ${escapeHtml(options.message)}
            </p>

            ${button}

            ${
              options.notice
                ? `
                  <div style="
                    background:#f1f5f9;
                    border-radius:10px;
                    padding:16px;
                    font-size:13px;
                    line-height:1.7;
                    color:#64748b;
                  ">
                    ${escapeHtml(options.notice)}
                  </div>
                `
                : ''
            }

          </div>

          <div style="
            background:#f8fafc;
            border-top:1px solid #e2e8f0;
            padding:24px;
            text-align:center;
            color:#64748b;
            font-size:12px;
            line-height:1.8;
          ">
            &copy; ${new Date().getFullYear()}
            MediConnect<br>
            Connected healthcare<br>
            This is an automated notification.
          </div>

        </div>

      </body>
    </html>
  `
}