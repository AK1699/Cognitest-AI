import React from 'react'

export const GraphqlIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/graphql.svg"
        alt="GraphQL"
        className={className}
        {...props}
    />
)
