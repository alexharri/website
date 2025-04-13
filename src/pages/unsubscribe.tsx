import Head from "next/head";
import { PostLayout } from "../components/PostLayout/PostLayout";
import { Layout } from "../components/Layout";
import { StyleOptions, useStyles } from "../utils/styles";
import { emailRegex } from "../utils/regex";
import { useState } from "react";

const styles = ({ styled, theme }: StyleOptions) => ({
  content: styled.css`
    form {
      display: flex;
      align-items: flex-start;
      gap: 16px;

      @media (max-width: 450px) {
        flex-direction: column;
      }
    }

    form + p {
      margin-top: 16px;
      margin-bottom: 0;

      &[data-success] {
        color: ${theme.text};
      }

      &[data-error] {
        color: #c35959;
      }
    }

    input {
      background: ${theme.background};
      border: 1px solid ${theme.medium400};
      color: ${theme.text};
      width: 240px;
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
      line-height: 22px;
      letter-spacing: 0.2px;
      transition: 0.2s;

      &:hover {
        background: #09426f;
      }

      &[data-pending="true"] {
        background: #162838;
        color: ${theme.text200};
        cursor: default;
      }
    }
  `,
});

export default function Page() {
  const s = useStyles(styles);

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) return;
    if (pending) return;
    setPending(true);
    setErrorMessage("");
    setSuccess(false);

    const onError = () =>
      setErrorMessage(
        "Failed to unsubscribe from mailing list. Please contact me if the error persists.",
      );
    try {
      const res = await fetch("/api/mailing-list/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setPending(false);
      if (res.status === 200) return setSuccess(true);
      onError();
    } catch (e) {
      console.log(e);
      onError();
    }
  };

  return (
    <Layout>
      <Head>
        <title>Unsubscribe | Alex Harri Jónsson</title>
      </Head>
      <PostLayout>
        <h1>Unsubscribe</h1>
        <div className={["flow", s("content")].join(" ")}>
          <p>To unsubscribe from my mailing list, please use the form below.</p>
          <form onSubmit={onSubmit}>
            <input
              placeholder="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" data-pending={pending}>
              {pending ? "Unsubscribing..." : "Unsubscribe"}
            </button>
          </form>
          {success && <p data-success="true">You've been unsubscribed.</p>}
          {errorMessage && <p data-error="true">{errorMessage}</p>}
        </div>
      </PostLayout>
    </Layout>
  );
}
