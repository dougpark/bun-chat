import { ICONS } from './icons.js';

const initIcons = (): void => {
    const inject = (selector: string, iconHtml: string): void => {
        document.querySelectorAll(selector).forEach((el: Element) => {
            (el as HTMLElement).innerHTML = iconHtml;
        });
    };

    inject('.icon-shield', ICONS.shield);
    inject('.icon-back', ICONS.back);
    inject('.icon-send', ICONS.send);
    inject('.icon-home', ICONS.home);
    inject('.icon-bell', ICONS.bell);
    inject('.icon-users', ICONS.users);
    inject('.icon-settings', ICONS.settings);
    inject('.icon-admin', ICONS.admin);
    inject('.icon-zones', ICONS.zones);
};

export { initIcons };