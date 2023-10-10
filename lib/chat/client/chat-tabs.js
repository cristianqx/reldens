/**
 *
 * Reldens - ChatTabs
 *
 */

const { ChatConst } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class ChatTabs
{

    constructor(gameManager, uiScene)
    {
        this.gameManager = gameManager;
        this.uiScene = uiScene;
        this.showTabs = this.gameManager.config.get('client/ui/chat/showTabs');
        this.containerTemplate = false;
        this.headerTemplate = false;
        this.contentTemplate = false;
        this.createTabs();
        this.activateTabs();
    }

    createTabs()
    {
        if(!this.isReady()){
            return false;
        }
        let chatTypes = sc.get(this.gameManager.initialGameData, 'chatTypes', []);
        if(0 === chatTypes.length){
            Logger.info('Chat types empty.');
            return false;
        }
        let chatContentsElement = this.gameManager.gameDom.getElement(ChatConst.SELECTORS.CONTENTS);
        if(!chatContentsElement){
            Logger.info('Chat contents element not found.');
            return false;
        }
        if(!this.fetchTemplates()){
            return false;
        }
        let tabsHeaders = '';
        let tabsContents = '';
        let i = 0;
        for(let chatType of chatTypes){
            if(!chatType.show_tab){
                continue;
            }
            let tabKey = chatType.key;
            let tabId = chatType.id;
            let headerClone = Object.assign({}, {headerTemplate: this.headerTemplate});
            tabsHeaders += this.gameManager.gameEngine.parseTemplate(
                headerClone.headerTemplate,
                {
                	tabId,
                	tabLabel: this.gameManager.services.translator.t(
                        ChatConst.SNIPPETS.PREFIX+ChatConst.SNIPPETS.TAB_PREFIX+tabKey
                    ),
                    className: 0 === i ? ' active' : ''
	            }
            );
            let contentClone = Object.assign({}, {contentTemplate: this.contentTemplate});
            tabsContents += this.gameManager.gameEngine.parseTemplate(
                contentClone.contentTemplate,
                {
                    tabId,
                    tabKey,
                    className: 0 !== i ? ' hidden' : ''
                }
            );
            i++;
        }
        let tabs = this.gameManager.gameEngine.parseTemplate(this.containerTemplate, {tabsHeaders, tabsContents});
        this.gameManager.gameDom.updateContent(ChatConst.SELECTORS.CONTENTS, tabs);
    }

    fetchTemplates()
    {
        this.containerTemplate = this.uiScene.cache.html.get('chatTabsContainer');
        if(!this.containerTemplate){
            Logger.info('Chat containerTemplate not found.');
            return false;
        }
        this.headerTemplate = this.uiScene.cache.html.get('chatTabLabel');
        if(!this.headerTemplate){
            Logger.info('Chat headerTemplate not found.');
            return false;
        }
        this.contentTemplate = this.uiScene.cache.html.get('chatTabContent');
        if(!this.contentTemplate){
            Logger.info('Chat contentTemplate not found.');
            return false;
        }
        return true;
    }

    isReady()
    {
        if(!this.gameManager){
            Logger.error('ChatTabs, missing game manager.');
        }
        if(!this.uiScene){
            Logger.error('ChatTabs, missing UI Scene.');
        }
        if(!this.showTabs || !this.gameManager || !this.uiScene){
            return false;
        }
        return true;
    }

    activateTabs()
    {
        let labels = this.gameManager.gameDom.getElements('.tab-label');
        for(let label of labels){
            label.addEventListener('click', (event) => {
                let previousLabel = this.gameManager.gameDom.getElement('.tab-label.active');
                previousLabel?.classList.remove('active');
                event.target.classList.add('active');
                let contents = this.gameManager.gameDom.getElements('.tab-content');
                for(let content of contents){
                    content.classList.add('hidden');
                }
                let activate = this.gameManager.gameDom.getElement('.tab-content-'+event.target.dataset.tabId);
                if(!activate){
                    Logger.warning('Tab content was not found.', event);
                    return false;
                }
                activate.classList.remove('hidden');
            });
        }
    }

}

module.exports.ChatTabs = ChatTabs;
