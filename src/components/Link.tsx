import NextLink, { LinkProps } from "next/link";
import React from "react";

/**
 * Returns '_blank' for URLs pointing to external websites.
 *
 * Returns '' for internal URLs.
 */
function getTarget(href: LinkProps["href"]) {
  if (typeof href === "string") {
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
}

export const Link = (props: Props) => {
  if (typeof props.href === "string") {
    // Links starting with '//' may be "schemaless" URLs like:
    //
    //    //assets.site.com/image/something.png
    //
    // While links starting with a single '/' are most likely absolute
    // URLs pointing to the current site.
    if (props.href.startsWith("/") && !props.href.startsWith("//")) {
      props.href = "";
    }
  }

  return <NextLink {...props} target={getTarget(props.href)} />;
};
