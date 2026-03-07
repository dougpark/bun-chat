import { ICONS_SVG } from './icons-svg.js';

export namespace ICONS {
    export const initIcons = (): void => {
        const inject = (selector: string, iconHtml: string): void => {
            document.querySelectorAll(selector).forEach((el: Element) => {
                (el as HTMLElement).innerHTML = iconHtml;
            });
        };

        inject('.icon-shield', ICONS_SVG.shield);
        inject('.icon-back', ICONS_SVG.back);
        inject('.icon-send', ICONS_SVG.send);
        inject('.icon-home', ICONS_SVG.home);
        inject('.icon-bell', ICONS_SVG.bell);
        inject('.icon-users', ICONS_SVG.users);
        inject('.icon-settings', ICONS_SVG.settings);
        inject('.icon-admin', ICONS_SVG.admin);
        inject('.icon-zones', ICONS_SVG.zones);
    };
}
// export { initIcons };