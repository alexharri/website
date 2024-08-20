import { useState } from "react";
import { emailRegex } from "../../utils/regex";
import { StyleOptions, useStyles } from "../../utils/styles";

const styles = ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    width: 480px;
    max-width: 100%;
    margin: 64px auto 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid ${theme.medium500};
    box-shadow: 0 8px 40px rgb(0 26 56);
  `,

  header: styled.css`
    text-align: center;
    background: ${theme.background500};
    padding: 8px 24px;
    font-size: 15px;
    letter-spacing: 0.2px;
    border-bottom: 1px solid ${theme.medium500};
    cursor: default;
    color: ${theme.text700};
  `,

  content: styled.css`
    background: ${theme.background200};
    padding: 8px 24px 24px;

    h2 {
      font-size: 24px;
      margin: 0;
    }

    p {
      font-size: 16px;
    }

    form {
      display: flex;
      align: center;
      gap: 16px;
    }

    input {
      background: ${theme.background};
      border: 1px solid ${theme.medium400};
      color: ${theme.text};
      flex-basis: 240px;
      min-width: 100px;
      -webkit-appearance: none;
      outline: none;
      padding: 10px 12px 10px;
      font-size: 14px;
      line-height: 20px;
      max-height: 40px;
      border-radius: 4px;
      max-width: 100%;

      &:focus {
        border-color: ${theme.blue};
      }

      &::placeholder {
        color: ${theme.text200};
      }
    }

    button {
      color: ${theme.text};
      background: #063459;
      border: 1px solid #0c4a7b;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      letter-spacing: 0.2px;
      transition: 0.2s;

      &:hover {
        background: #09426f;
      }
    }
  `,
});

export const SubscribeToNewsletter: React.FC = () => {
  const s = useStyles(styles);

  const [email, setEmail] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      return;
    }

    const res = await fetch("/api/mailing-list/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    console.log(`status: ${res.status}`);
  };

  return (
    <div>
      <div className={s("wrapper")}>
        <div className={s("header")}>Mailing list</div>
        <div className={s("content")}>
          <p>To be notified of new posts, subscribe to my mailing list.</p>
          <form onSubmit={onSubmit}>
            <input
              placeholder="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  );
};
