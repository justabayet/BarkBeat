import { useEffect } from "react";

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
        let startedInside = false;
        let startedWhenMounted = false;

        const listener = (event: MouseEvent | TouchEvent) => {
            if (startedInside || !startedWhenMounted) return;
            if (!ref.current || ref.current.contains(event.target as Node)) return;


            handler(event);
        };

        const validateEventStart = (event: MouseEvent | TouchEvent) => {
            startedWhenMounted = !!ref.current;
            startedInside = !!(ref.current && ref.current.contains(event.target as Node));
        };

        window.addEventListener("mousedown", validateEventStart);
        window.addEventListener("touchstart", validateEventStart);
        window.addEventListener("click", listener);

        return () => {
            window.removeEventListener("mousedown", validateEventStart);
            window.removeEventListener("touchstart", validateEventStart);
            window.removeEventListener("click", listener);
        };
    }, [ref, handler]);
};

export default useClickOutside;
