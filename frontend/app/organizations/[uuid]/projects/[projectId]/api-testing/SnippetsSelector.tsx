"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Code2, Search, PlusCircle } from "lucide-react";
import { SNIPPETS, Snippet } from "./snippets";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface SnippetsSelectorProps {
    type: 'pre-request' | 'post-request' | 'body';
    onSelect: (content: string) => void;
}

export const SnippetsSelector: React.FC<SnippetsSelectorProps> = ({ type, onSelect }) => {
    const [search, setSearch] = useState("");

    const filteredSnippets = SNIPPETS.filter(s =>
        s.type === type &&
        (s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-primary transition-colors"
                    title="Snippets"
                >
                    <Code2 className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" side="top">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500">Snippets</span>
                        <span className="text-[10px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                            {type.replace('-', ' ')}
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                            placeholder="Find a snippet..."
                            className="h-8 pl-8 text-xs bg-white border-gray-200 focus:ring-1 focus:ring-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="h-64">
                    <div className="p-1">
                        {filteredSnippets.length > 0 ? (
                            filteredSnippets.map((snippet) => (
                                <button
                                    key={snippet.id}
                                    className="w-full text-left p-2.5 rounded-md hover:bg-primary/5 group transition-colors flex flex-col gap-1 border border-transparent hover:border-primary/10"
                                    onClick={() => onSelect(snippet.content)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-700 group-hover:text-primary transition-colors">
                                            {snippet.name}
                                        </span>
                                        <PlusCircle className="w-3 h-3 text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                        {snippet.description}
                                    </p>
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-xs text-gray-400">No snippets found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t border-gray-100 bg-gray-50/30 rounded-b-lg">
                    <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">
                        Click a snippet to insert it
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
};
