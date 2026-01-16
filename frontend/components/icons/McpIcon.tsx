import React from 'react'

export const McpIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/MCP.svg"
        alt="MCP"
        className={className}
        {...props}
    />
)
