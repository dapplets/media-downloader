// import { IWidget } from 'dynamic-adapter.dapplet-base.eth';

export interface IButtonState {
    img: string;
    label: string;
    loading: boolean;
    disabled: boolean;
    hidden: boolean;
    exec: (ctx: any, me: IButtonState) => void;
    init: (ctx: any, me: IButtonState) => void;
    ctx: any;
    insPointName: string;
}

export class Button {
    public el: HTMLElement;
    public state: IButtonState;
    insPointName: string;

    public mount() {
        if (!this.el) this._createElement();

        const { img, label, loading, disabled, hidden } = this.state;

        if (hidden) {
            this.el.innerHTML = '';
            return;
        } else {
            this.el.innerHTML = label;
        }
    }

    public unmount() {
        this.el && this.el.remove();
    }

    private _createElement() {
        this.el = document.createElement('button');
        this.el.addEventListener("click", e => {
            if (!this.state.disabled) {
                this.state.exec?.(this.state.ctx, this.state);
            }
        });
        this.mount();
        this.state.init?.(this.state.ctx, this.state);
    }
}