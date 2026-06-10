'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { StyleRegistry, createStyleRegistry } from 'styled-jsx';

export default function StyledJsxRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jsxRegistry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = jsxRegistry.styles();
    jsxRegistry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={jsxRegistry}>{children}</StyleRegistry>;
}
