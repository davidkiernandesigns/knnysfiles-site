'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { seed, type Content } from './site';

const ContentContext = createContext<Content>(seed);

export function ContentProvider({ content, children }: { content: Content; children: ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
