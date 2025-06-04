import { keyframes } from '@emotion/react';
import { GlobalStyles } from '@mui/material';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';

export const GlobalVirtualListStyles = () => (
  <GlobalStyles
    styles={{
      '.VirtualList': {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',

        '&:focus': {
          outline: 'none'
        }
      },
      '.VirtualList-itemPrototype': {
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      },
      '.VirtualList-scrollPositionMarker': {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        top: 0,
        height: 0,
        left: 0,
        right: 0
      },
      '.VirtualList-renderedItems': { position: 'relative' },
      '.VirtualList-item': {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 2,

        '&.animated-top': {
          transition: `top ${ANIMATION_DURATION_MSEC / 1000}s ease-in-out`,
          zIndex: 2,

          '&.moving': {
            animation: `${moving} ${ANIMATION_DURATION_MSEC / 1000}s ease-in-out`,
            animationFillMode: 'forwards',
            zIndex: 3
          }
        },
        '&.fade-in': {
          animation: `${fadeIn} ${ANIMATION_DURATION_MSEC / 1000}s linear`,
          animationFillMode: 'forwards',
          mixBlendMode: 'plus-darker',
          zIndex: 1
        },
        '&.fade-out': {
          animation: `${fadeOut} ${ANIMATION_DURATION_MSEC / 1000}s linear`,
          animationFillMode: 'forwards',
          zIndex: 0
        }
      }
    }}
  />
);

// Helpers

const fadeIn = keyframes`
from {
  opacity: 0%;
}

to {
  opacity: 100%;
}
`;

const fadeOut = keyframes`
from {
  opacity: 100%;
}

to {
  opacity: 0%;
}
`;

const moving = keyframes`
from, to {
  box-shadow: 0px 0px 0px 0px rgba(0,0,0,0.3);
}

25%, 75% {
  box-shadow: 0px 0px 8px 0px rgba(0,0,0,0.3);
}
`;
