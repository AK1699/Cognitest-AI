import React from 'react'

export const HttpIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/http.svg"
        alt="HTTP"
        className={className}
        {...props}
    />
)
