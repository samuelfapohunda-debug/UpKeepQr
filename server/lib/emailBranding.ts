const BRAND_GREEN = '#10B981';
const BRAND_NAVY = '#1E3A5F';
const BRAND_DARK_GREEN = '#059669';

export function getEmailLogoHtml(): string {
  return `<span style="font-size: 28px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: ${BRAND_GREEN};">Maint</span><span style="color: ${BRAND_NAVY};">Cue</span></span>`;
}

export function getEmailHeader(subtitle?: string): string {
  return `
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_DARK_GREEN} 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <div style="margin-bottom: ${subtitle ? '8px' : '0'};">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
              </div>
              ${subtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">${subtitle}</p>` : ''}
            </td>
          </tr>`;
}

export function getEmailHeaderDiv(subtitle?: string): string {
  return `
  <div style="background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_DARK_GREEN} 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="margin-bottom: ${subtitle ? '8px' : '0'};">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
    </div>
    ${subtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">${subtitle}</p>` : ''}
  </div>`;
}

export function getEmailFooter(): string {
  return `
          <tr>
            <td style="background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0;">${getEmailLogoHtml().replace('28px', '18px')}</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
              <p style="margin: 8px 0 0 0;">
                <a href="https://maintcue.com" style="color: ${BRAND_GREEN}; text-decoration: none;">maintcue.com</a> |
                <a href="mailto:support@maintcue.com" style="color: ${BRAND_GREEN}; text-decoration: none;">support@maintcue.com</a>
              </p>
            </td>
          </tr>`;
}

export function getEmailFooterDiv(): string {
  return `
  <div style="background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 8px 0;">${getEmailLogoHtml().replace('28px', '18px')}</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
    <p style="margin: 8px 0 0 0;">
      <a href="https://maintcue.com" style="color: ${BRAND_GREEN}; text-decoration: none;">maintcue.com</a> |
      <a href="mailto:support@maintcue.com" style="color: ${BRAND_GREEN}; text-decoration: none;">support@maintcue.com</a>
    </p>
  </div>`;
}

export function getEmailCssHeaderClass(): string {
  return `.header { background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_DARK_GREEN} 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }`;
}

export { BRAND_GREEN, BRAND_NAVY, BRAND_DARK_GREEN };
