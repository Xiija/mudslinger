import {Message} from './message';
import {OutWinBase} from './outWinBase';

declare let $;

export class ChatWin extends OutWinBase {
    private pMessage: Message;
    
    private html;

    constructor(pMessage: Message) {
        super();
        this.pMessage = pMessage;

        this.pMessage.sub('prepare_reload_layout', this.prepare_reload_layout, this);
        this.pMessage.sub('load_layout', this.load_layout, this);
    }

    private prepare_reload_layout() {
        this.html = $('#win_chat').html();
    };

    private load_layout() {
        this.set_root_elem($('#win_chat'));
        if (this.html) {
            $('#win_chat').html(this.html);
            this.html = null;
        }
    }
}

