import Markdown from "markdown-to-jsx";
import { Pages } from './pages';
import React from 'react';

type PagesProps = {
    pageContent: string;
}

export const Post:React.FC<PagesProps> = ({ pageContent }: PagesProps) => {
    return <Markdown>{pageContent}</Markdown>;
}
