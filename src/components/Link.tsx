import NextLink, { LinkProps } from "next/link";
import React from "react";

/**
 * Returns '_blank' for URLs pointing to external websites.
 *
 * Returns '' for internal URLs.
 */
function getTarget(href: LinkProps["href"]) {
  if (typeof href === "string") {
    if (href.startsWith("#")) {
      return "";
    }

    // Links starting with '//' may be "schemaless" URLs like:
    //
    //    //assets.site.com/image/something.png
    //
    // While links starting with a single '/' are most likely absolute
    // URLs pointing to the current site.
    if (href.startsWith("/") && !href.startsWith("//")) {
      return "";
    }
  }

  return "_blank";
}

interface Props extends LinkProps {
  children: React.ReactNode;
  className?: string;
}

export const Link = (props: Props) => {
  return <NextLink {...props} target={getTarget(props.href)} />;
};
