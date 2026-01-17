"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface JsonTableProps {
    data: any;
}

export const JsonTable: React.FC<JsonTableProps> = ({ data }) => {
    if (data === null || data === undefined) {
        return <div className="text-gray-400 italic">null</div>;
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <div className="text-gray-400 italic">Empty array</div>;
        }

        // Check if it's an array of objects
        const isArrayOfObjects = data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

        if (isArrayOfObjects) {
            // Get all unique keys from all objects
            const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));

            return (
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                {headers.map(header => (
                                    <TableHead key={header} className="text-[10px] font-black uppercase tracking-wider text-gray-500 h-8">
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index} className="hover:bg-gray-50/30">
                                    {headers.map(header => (
                                        <TableCell key={`${index}-${header}`} className="text-xs font-medium py-2">
                                            {renderCellContent(item[header])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        }

        // Regular array of primitives
        return (
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-500 h-8">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={index} className="hover:bg-gray-50/30">
                                <TableCell className="text-xs font-medium py-2">
                                    {renderCellContent(item)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    // Handle Objects
    if (typeof data === 'object') {
        const entries = Object.entries(data);
        if (entries.length === 0) {
            return <div className="text-gray-400 italic">Empty object</div>;
        }

        return (
            <div className="border rounded-md overflow-hidden max-w-2xl">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-500 h-8 w-1/3">Key</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-500 h-8">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map(([key, value]) => (
                            <TableRow key={key} className="hover:bg-gray-50/30">
                                <TableCell className="text-xs font-bold text-gray-700 py-2 border-r">{key}</TableCell>
                                <TableCell className="text-xs font-medium py-2 truncate max-w-md">
                                    {renderCellContent(value)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    // Primitives
    return <div className="text-xs font-medium">{String(data)}</div>;
};

const renderCellContent = (value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-300 italic">null</span>;
    if (typeof value === 'boolean') return <span className={value ? "text-blue-600" : "text-red-500"}>{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-green-600">{value}</span>;
    if (typeof value === 'object') return <span className="text-gray-400 font-mono text-[10px]">{JSON.stringify(value)}</span>;
    return <span>{String(value)}</span>;
};
