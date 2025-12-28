'use client'
import React from 'react'
import styled, { keyframes } from 'styled-components'
import { Search } from 'lucide-react'

const searchAnimation = keyframes`
  0% {
    transform: translate(-20px, -20px) rotate(-10deg);
  }
  25% {
    transform: translate(20px, -15px) rotate(5deg);
  }
  50% {
    transform: translate(15px, 20px) rotate(-5deg);
  }
  75% {
    transform: translate(-20px, 15px) rotate(10deg);
  }
  100% {
    transform: translate(-20px, -20px) rotate(-10deg);
  }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  width: 100px;
  position: relative;
`

const MagnifierWrapper = styled.div`
  color: #05757f;
  animation: ${searchAnimation} 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 6px rgba(5, 117, 127, 0.15));
`

export default function MagnifierLoader() {
    return (
        <Container>
            <MagnifierWrapper>
                <Search className="w-12 h-12" />
            </MagnifierWrapper>
        </Container>
    )
}
