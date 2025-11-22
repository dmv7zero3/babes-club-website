import * as React from "react";

export type HorizontalIconProps = React.SVGProps<SVGSVGElement>;

const PATH_D =
  "M143.2,87.6s-18.9-1.3-37.5,6.6c3.5-4.1,6.9-8.6,10-13.7,15.4-25.1,16.8-52.3,16.8-52.3,0,0-23.6,13.5-39.1,38.7-2.3,3.7-4.2,7.4-5.9,11.1,1-6.2,1.7-12.8,1.7-19.7,0-32.2-14.3-58.3-14.3-58.3,0,0-14.3,26.1-14.3,58.3s.7,13.6,1.7,19.7c-1.7-3.7-3.6-7.4-5.9-11.1C41.1,41.8,17.5,28.2,17.5,28.2c0,0,1.4,27.2,16.8,52.3,3.1,5,6.5,9.6,10,13.7-18.7-7.9-37.5-6.6-37.5-6.6,0,0,11.4,14.2,30.1,22.2,7.1,3,14.3,4.7,20.5,5.7-2.9.2-6,.6-9.2,1.4-13.6,3.3-23.1,11.7-23.1,11.7,0,0,12.6,2.9,26.3-.4,8.8-2.2,15.9-6.4,19.8-9.1l-3.3,26.1c-.2,1.2.2,2.5.9,3.4.8.9,1.8,1.5,3,1.5h6.2c1.1,0,2.2-.5,3-1.5.8-.9,1.1-2.2.9-3.4l-3.3-26.1c3.9,2.7,10.9,7,19.8,9.1,13.6,3.3,26.3.4,26.3.4,0,0-9.5-8.3-23.1-11.7-3.2-.8-6.3-1.2-9.2-1.4,6.2-.9,13.3-2.6,20.5-5.7,18.7-8,30.1-22.2,30.1-22.2Z";

const HorizontalIcon = React.forwardRef<SVGSVGElement, HorizontalIconProps>(
  function HorizontalIcon({ children, ...props }, ref) {
    return React.createElement(
      "svg",
      {
        ...props,
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 150 150",
        fill: props.fill ?? "currentColor",
        role: "img",
        "aria-hidden": props["aria-label"] ? undefined : true,
        focusable: "false",
      } as React.SVGProps<SVGSVGElement> & { ref?: React.Ref<SVGSVGElement> },
      [React.createElement("path", { key: "p", d: PATH_D }), children]
    );
  }
);

export default HorizontalIcon;
