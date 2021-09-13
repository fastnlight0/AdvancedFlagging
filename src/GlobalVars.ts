import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import { Flags, FlagCategory, HumanFlags } from './FlagTypes';
import { displayToaster } from './AdvancedFlagging';

export type StacksToastState = 'success' | 'danger' | 'info' | 'warning';
export type PostType = 'Question' | 'Answer';

export interface CachedFlag {
    Id: number;
    DisplayName: string;
    FlagText: string;
    Comments: {
        Low: string;
        High: string;
    };
    ReportType: Flags;
    Feedbacks: FlagTypeFeedbacks;
    BelongsTo: string; // the Name of the category it belongs to
    IsDefault: boolean;
    SendWhenFlagRaised: boolean;
    Downvote: boolean;
    Enabled: boolean;
}

export type CachedCategory = Omit<FlagCategory, 'FlagTypes'>;

export interface CachedConfiguration {
    OpenOnHover: boolean;
    DefaultNoFlag: boolean;
    DefaultNoComment: boolean;
    DefaultNoDownvote: boolean;
    DefaultNoSmokey: boolean;
    DefaultNoNatty: boolean;
    DefaultNoGuttenberg: boolean;
    DefaultNoGenericBot: boolean;
    WatchFlags: boolean;
    WatchQueues: boolean;
    LinkDisabled: boolean;
    AddAuthorName: boolean;
}

export interface FlagTypeFeedbacks {
    Smokey: 'tpu-' | 'tp-' | 'fp-' | 'naa-' | '';
    Natty: 'tp' | 'fp' | 'ne' | '';
    Guttenberg: 'tp' | 'fp' | '';
    'Generic Bot': 'track' | ''; // 'track' => track the post, '' => don't
}
export type BotNames = keyof FlagTypeFeedbacks;
export type AllFeedbacks = FlagTypeFeedbacks[BotNames] | '(none)';
export const possibleFeedbacks: { [key in BotNames]: AllFeedbacks[] } = {
    Smokey: ['tpu-', 'tp-', 'fp-', 'naa-', ''],
    Natty: ['tp', 'fp', 'ne', ''],
    Guttenberg: ['tp', 'fp', ''],
    'Generic Bot' : ['track', '']
};

interface UserDetails {
    authorReputation: number;
    authorName: string;
}

export enum FlagNames {
    Spam = 'PostSpam',
    Rude = 'PostOffensive',
    NAA = 'AnswerNotAnAnswer',
    VLQ = 'PostLowQuality',
    ModFlag = 'PostOther',
    NoFlag = 'NoFlag'
}

// Constants
export const soboticsRoomId = 111347;
export const metasmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
export const metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
export const copypastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
export const copypastorServer = 'https://copypastor.sobotics.org';
export const genericBotKey = 'Cm45BSrt51FR3ju';
const placeholderTarget = /\$TARGET\$/g;
const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
export const nattyFeedbackUrl = 'https://logs.sobotics.org/napi-1.1/api/stored/';
export const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
export const dayMillis = 1000 * 60 * 60 * 24;
export const popupDelay = 4 * 1000;
export const settingUpTitle = 'Setting up MetaSmoke';
export const settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
                           + 'To reset configuration, see the footer of Stack Overflow.';
export const genericBotSuccess = 'Post tracked with Generic Bot';
export const genericBotFailure = 'Server refused to track the post';
export const metasmokeReportedMessage = 'Post reported to Smokey';
export const metasmokeFailureMessage = 'Failed to report post to Smokey';
export const nattyReportedMessage = 'Post reported to Natty';
export const chatFailureMessage = 'Failed to send message to chat';
export const isStackOverflow = /^https:\/\/stackoverflow.com/.test(window.location.href);
export const isQuestionPage = /\/questions\/\d+.*/.test(window.location.href);
export const isNatoPage = window.location.href.includes('/tools/new-answers-old-questions');
export const isFlagsPage = /\/users\/flag-summary\/\d+/.test(window.location.href);
export const isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(window.location.href);
export const flexItemDiv = $('<div>').addClass('flex--item');
export const noneString = '<span class="o50">(none)</span>';
const botImages = {
    Natty: 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1',
    Smokey: 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1',
    'Generic Bot': 'https://i.stack.imgur.com/6DsXG.png?s=32&g=1',
    Guttenberg: 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1'
};

// Cache keys
export const ConfigurationCacheKey = 'Configuration';
export const ConfigurationOpenOnHover = 'OpenOnHover';
export const ConfigurationDefaultNoFlag = 'DefaultNoFlag';
export const ConfigurationDefaultNoComment = 'DefaultNoComment';
export const ConfigurationDefaultNoDownvote = 'DefaultNoDownvote';
export const ConfigurationWatchFlags = 'WatchFlags';
export const ConfigurationWatchQueues = 'WatchQueues';
export const ConfigurationLinkDisabled = 'LinkDisabled';
export const ConfigurationAddAuthorName = 'AddAuthorName';
export const CacheChatApiFkey = 'fkey';
export const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
export const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
export const FlagTypesKey = 'FlagTypes';
export const FlagCategoriesKey = 'FlagCategories';

type ConfigObject<T> = { [key in keyof T]: string };
const addPrefixToObjectValues = <T>(prefix: string, attributesObject: T): ConfigObject<T> => Object.fromEntries(
    Object.entries(attributesObject).map(([key, value]) => ([key, `${prefix}${value as string}`]))
) as ConfigObject<T>; // keys will remain the same

const prefix = 'advanced-flagging';
const classesObj = {
    dialog: 'dialog',
    commentsSendFeedbackRadios: 'comments-send-feedback',
    commentsSendWhenFlagRaised: 'comments-send-when-flag-raised',
    commentsDownvoteOption: 'comments-downvote-option',
    commentsFlagOptions: 'comments-flag-options',
    commentsFeedbackRadios: 'comments-feedback-radios',
    commentsSubmit: 'comments-submit',
    commentsReset: 'comments-reset',
    commentsExpandableTrigger: 'comments-expandable-trigger',
    commentsRemoveExpandable: 'comments-expandable-remove',
    commentsToggleSwitch: 'comments-enable-disable-flagtype',
    commentsInvalid: 'comments-invalid-content',
    commentsTextCounter: 'comments-text-counter',
    commentsTextsContainer: 'comments-textareas-container',
    commentsToggleLeaveComment: 'comments-toggle-leave-comment',
    commentsToggleHighRep: 'comments-toggle-highrep-leave-comment',
    commentsFlagContent: 'comments-flag-textarea-content',
    commentsLowRepContent: 'comments-lowrep-textarea-content',
    commentsHighRepContent: 'comments-highrep-textarea-content'
};
const idsObj = {
    snackbar: 'snackbar',
    configButton: 'configuration-button',
    configButtonContainer: 'configuration-button-container',
    configModal: 'configuration-modal',
    configDescription: 'configuration-modal-description',
    configGeneralSection: 'configuration-section-general',
    configReset: 'configuration-reset',
    commentsButton: 'comments-button',
    commentsButtonContainer: 'comments-button-container',
    commentsModal: 'comments',
    metasmokeTokenModal: 'metasmoke-token-modal',
    metasmokeTokenSave: 'metasmoke-token-save',
    metasmokeTokenInput: 'metasmoke-token-input'
};

// prepend the prefix
// *Selectors will already have the advanced-flagging- prefix, so we need # for ids and . for classes
export const modalClasses = addPrefixToObjectValues<typeof classesObj>(`${prefix}-`, classesObj);
export const classSelectors = addPrefixToObjectValues<typeof modalClasses>('.', modalClasses);
export const modalIds = addPrefixToObjectValues<typeof idsObj>(`${prefix}-`, idsObj);
export const idSelectors = addPrefixToObjectValues<typeof modalIds>('#', modalIds);

export const getDynamicAttributes = {
    feedbackRadioId: (botName: string, flagId: number, feedback: string): string => `${prefix}${botName}-${flagId}-feedack-${feedback}`,
    feedbackRadioName: (flagId: number, botName: string): string => `${prefix}${flagId}-feedback-to-${botName}`,
    sendWhenFlagRaised: (flagId: number): string => `${modalClasses.commentsSendWhenFlagRaised}-${flagId}`,
    downvoteOption: (flagId: number): string => `${modalClasses.commentsDownvoteOption}-${flagId}`,
    expandableId: (flagId: number, displayName: string): string => [prefix, flagId, displayName].join('-'),
    categoryContent: (displayName: string): string => `${prefix}-comments-${displayName}-content`,
    toggleSwitchId: (flagId: number): string => `${prefix}-comments-toggle-${flagId}`,
    highRepCheckbox: (flagId: number): string => `${prefix}-highrep-${flagId}-checkbox`,
    configSection: (sectionName: string): string => `${prefix}-configuration-section-${sectionName}`,
    textareaContent: (contentType: string): string => `${prefix}-comments-${contentType}-textarea-content`,
    popoverSendFeedbackTo: (botName: string, postId: number): string => `${prefix}-send-feedback-to-${botName}-${postId}`,
    optionCheckbox: (checkboxType: string, postId: number): string => `${prefix}-${checkboxType}-checkbox-${postId}`
};

export const getStacksSvg = (svgName: string): JQuery => $(GM_getResourceText(svgName));

export const displayStacksToast = (message: string, type: StacksToastState): void => StackExchange.helpers.showToast(message, {
    type: type,
    transientTimeout: popupDelay
});
export const attachPopover = (element: Element, text: string, position = 'bottom-start'): void => {
    Stacks.setTooltipText(element, text, { placement: position as Stacks.TooltipOptions['placement'] });
};
export const attachHtmlPopover = (element: Element, text: string, position = 'bottom-start'): void => {
    Stacks.setTooltipHtml(element, text, { placement: position as Stacks.TooltipOptions['placement'] });
};

// regexes
export const isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
export const isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
export const flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
export function getFlagsUrlRegex(postId: number): RegExp {
    return new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther|PostLowQuality)`);
}

// various helper functions
export const showElement = (element: JQuery): JQuery => element.addClass('d-block').removeClass('d-none');
export const showInlineElement = (element: JQuery): JQuery => element.addClass('d-inline-block').removeClass('d-none');
export const displaySuccess = (message: string): void => displayToaster(message, 'success');
export const displayError = (message: string): void => displayToaster(message, 'danger');
export const isPostDeleted = (postId: number): boolean => $(`#question-${postId}, #answer-${postId}`).hasClass('deleted-answer');

export function getParamsFromObject<T>(object: T): string {
    return Object.entries(object).map(item => item.join('=')).join('&');
}
export function getFormDataFromObject<T extends { [key: string]: string }>(object: T): FormData {
    return Object.keys(object).reduce((formData, key) => {
        formData.append(key, object[key]);
        return formData;
    }, new FormData());
}
const getCopypastorLink = (postId: number): string => `https://copypastor.sobotics.org/posts/${postId}`;
export const getPostIdFromReview = (): number => Number($('[id^="answer-"]').attr('id')?.split('-')[1]);
export const getCachedConfigBotKey = (botName: BotNames): string => `DefaultNo${botName.replace(/\s/g, '')}`;
export function qualifiesForVlq(postScore: number, creationDate: Date): boolean {
    return postScore <= 0 && (new Date().valueOf() - creationDate.valueOf()) < dayMillis;
}

export function getSentMessage(success: boolean, feedback: string, bot: string): string {
    return success ? `Feedback ${feedback} sent to ${bot}` : `Failed to send feedback ${feedback} to ${bot}`;
}

// jQuery icon elements
const sampleIcon = flexItemDiv.clone().addClass(`d-none ${isQuestionPage || isLqpReviewPage ? '' : ' ml8'}`)
    .append($('<a>').addClass('s-avatar s-avatar__16 s-user-card--avatar').append($('<img>').addClass('s-avatar--image')));
export const getBotImageEl = (botName: BotNames): JQuery => sampleIcon.clone().find('img').attr('src', botImages[botName]).parents('div');

// dynamically generated jQuery elements
export const getMessageDiv = (text: string, state: string): JQuery => $('<div>').addClass(`p12 bg-${state}`).text(text).hide();
export const getSectionWrapper = (name: string): JQuery => $('<fieldset>').html(`<h2 class="flex--item">${name}</h2>`)
    .addClass('d-flex gs8 gsy fd-column').attr('id', getDynamicAttributes.configSection(name.toLowerCase()));
export const getTextarea = (content: string, labelText: string, contentType: 'flag' | 'lowrep' | 'highrep'): JQuery => $(`
<div class="d-flex gs4 gsy fd-column" style="display: ${content ? 'flex' : 'none'} !important;">
    <label class="flex--item s-label">${labelText}</label>
    <textarea rows=4 class="flex--item s-textarea fs-body2 ${getDynamicAttributes.textareaContent(contentType)}">${content}</textarea>
</div>`);

const iconWrapper = $('<div>').addClass('flex--item').css('display', 'none'); // the element that will contain the bot icons
export const performedActionIcon = (): JQuery => iconWrapper.clone().append(getStacksSvg('Checkmark').addClass('fc-green-500'));
export const failedActionIcon = (): JQuery => iconWrapper.clone().append(getStacksSvg('Clear').addClass('fc-red-500'));
export const reportedIcon = (): JQuery => iconWrapper.clone().append(getStacksSvg('Flag').addClass('fc-red-500'));
export const popupWrapper = $('<div>').addClass('fc-white fs-body3 ta-center z-modal ps-fixed l50').attr('id', modalIds.snackbar);

export const advancedFlaggingLink = $('<button>').attr('type', 'button').addClass('s-btn s-btn__link').text('Advanced Flagging');
export const popoverArrow = $('<div>').addClass('s-popover--arrow s-popover--arrow__tc');
export const dropdown = $('<div>').addClass(`${modalClasses.dialog} s-popover s-anchors s-anchors__default mt2 c-default`);
export const actionsMenu = $('<ul>').addClass('s-menu mxn12 myn8').attr('role', 'menu');
export const dropdownItem = $('<li>').attr('role', 'menuitem');
export const reportLink = $('<a>').addClass('s-block-link py4');
export const categoryDivider = $('<li>').addClass('s-menu--divider').attr('role', 'separator');
const getOptionCheckbox = (elId: string): JQuery => $(`<input type="checkbox" name="${elId}" id="${elId}" class="s-checkbox">`);
const getOptionLabel = (elId: string, text: string): JQuery => $(`<label for="${elId}" class="ml6 va-middle c-pointer">${text}</label>`);
export const getPopoverOption = (itemId: string, checked: boolean, text: string): JQuery => dropdownItem.clone().addClass('pl6')
    .append(getOptionCheckbox(itemId).prop('checked', checked), getOptionLabel(itemId, text));

export const configurationDiv = $('<div>').addClass('ta-left pt6').attr('id', modalIds.configButtonContainer);
export const configurationLink = $('<a>').attr('id', modalIds.configButton).text('AdvancedFlagging configuration');
export const commentsDiv = configurationDiv.clone().attr('id', modalIds.configButtonContainer);
export const commentsLink = configurationLink.clone().attr('id', modalIds.commentsButton).text('AdvancedFlagging: edit comments and flags');

const generateBasicModal = (modalId: string, primaryText: string, modalTitle: string, modalWidth: string): JQuery => $(`
<aside class="s-modal" id="${modalId}" role="dialog" aria-hidden="true" data-controller="s-modal" data-s-modal-target="modal">
    <div class="s-modal--dialog s-modal__full ${modalWidth} sm:w100 md:w75 lg:w75" role="document">
        <h1 class="s-modal--header fw-body" id="${modalId}-title">${modalTitle}</h1>
        <div class="s-modal--body fs-body2" id="${modalId}-description"></div>
        <div class="d-flex gs8 gsx s-modal--footer">
            <button class="flex--item s-btn s-btn__primary" type="button">${primaryText}</button>
            <button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide">
            ${getStacksSvg('Clear')[0].outerHTML}
        </button>
    </div>
</aside>`);
export const configurationModal = generateBasicModal(modalIds.configModal, 'Save changes', 'AdvancedFlagging configuration', 'w60');
const configurationResetButton = $('<button>')
    .addClass('flex--item s-btn s-btn__danger')
    .text('Reset')
    .attr('id', modalIds.configReset)
    .attr('type', 'button');
configurationModal.find('.s-modal--footer').append(configurationResetButton);

const metasmokeTokenPopup = generateBasicModal(modalIds.metasmokeTokenModal, 'Submit', 'Authenticate MS with AF', '');
metasmokeTokenPopup.find('.s-btn__primary').attr('id', modalIds.metasmokeTokenSave);
metasmokeTokenPopup.find('.s-modal--body').append(`
<div class="d-flex gs4 gsy fd-column">
    <div class="flex--item">
        <label class="s-label" for="example-item1">
            Metasmoke access token
            <p class="s-description mt2">
                Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:
            </p>
        </label>
    </div>
    <div class="d-flex ps-relative">
        <input class="s-input" type="text" id="${modalIds.metasmokeTokenInput}" placeholder="Enter the code here">
    </div>
</div>`);

export const editCommentsPopup = generateBasicModal(modalIds.commentsModal, 'I\'m done!', 'AdvancedFlagging: edit popover options', 'w80');
const resetButton = $('<button>')
    .addClass(`flex--item s-btn s-btn__danger ${modalClasses.commentsReset}`)
    .text('Reset')
    .attr('type', 'button');
editCommentsPopup.find('.s-modal--body').append($('<div>').addClass('d-flex fd-column gs16'));
editCommentsPopup.find('.s-modal--footer').append(resetButton);

export function showMSTokenPopupAndGet(): Promise<string | undefined> {
    return new Promise<string | undefined>(resolve => {
        StackExchange.helpers.showModal(metasmokeTokenPopup);
        $(idSelectors.metasmokeTokenSave).on('click', () => {
            const token = $(idSelectors.metasmokeTokenInput).val();
            $(idSelectors.metasmokeTokenModal).remove(); // dismiss modal
            if (!token) return;
            resolve(token.toString());
        });
    });
}

export async function Delay(milliseconds: number): Promise<void> {
    return await new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export async function showConfirmModal(title: string, bodyHtml: string): Promise<boolean> {
    return await StackExchange.helpers.showConfirmModal({
        title: title,
        bodyHtml: bodyHtml,
        buttonLabel: 'Authenticate!'
    });
}

// Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
let initialized = false;
const callbacks: ((request: XMLHttpRequest) => void)[] = [];
export function addXHRListener(callback: (request: XMLHttpRequest) => void): void {
    callbacks.push(callback);
    if (initialized) return;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(): void {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);
        // eslint-disable-next-line prefer-rest-params
        open.apply(this, arguments);
    };
    initialized = true;
}

// cache-related helpers/values
// Some information from cache is stored on the variables as objects to make editing easier and simpler
// Each time something is changed in the variables, update* must also be called to save the changes to the cache
export const cachedConfiguration = GreaseMonkeyCache.getFromCache<CachedConfiguration>(ConfigurationCacheKey) || {} as Partial<CachedConfiguration>;
export const updateConfiguration = (): void => GreaseMonkeyCache.storeInCache(ConfigurationCacheKey, cachedConfiguration);
export const cachedFlagTypes = GreaseMonkeyCache.getFromCache<CachedFlag[]>(FlagTypesKey) || [];
export const updateFlagTypes = (): void => GreaseMonkeyCache.storeInCache(FlagTypesKey, cachedFlagTypes);
export const cachedCategories = GreaseMonkeyCache.getFromCache<CachedCategory[]>(FlagCategoriesKey) || [] as (Partial<CachedCategory>)[];
// export const updateCategories = (): void => GreaseMonkeyCache.storeInCache(FlagCategoriesKey, cachedCategories);

// Adds the author name before the comment if the option is enabled and determines if the comment should be low/high rep
export function getFullComment(flagId: number, { authorReputation, authorName }: UserDetails): string | null {
    const shouldAddAuthorName = cachedConfiguration.AddAuthorName;
    const flagType = getFlagTypeFromFlagId(flagId);
    const comment = flagType?.Comments[authorReputation > 50 ? 'High' : 'Low'] || flagType?.Comments.Low;
    return (comment && shouldAddAuthorName ? `${authorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || null;
}

// Replaces the placeholders with actual values in the cached flag text
export function getFullFlag(flagId: number, target: string, postId: number): string {
    const flagType = getFlagTypeFromFlagId(flagId);
    const flagContent = flagType?.FlagText;
    if (!flagContent) return '';
    return flagContent.replace(placeholderTarget, target).replace(placeholderCopypastorLink, getCopypastorLink(postId));
}

export function getFlagTypeFromFlagId(flagId: number): CachedFlag | null {
    return cachedFlagTypes.find(flagType => flagType.Id === flagId) || null;
}

export function getHumanFromDisplayName(displayName: Flags): HumanFlags {
    switch (displayName) {
        case FlagNames.NAA: return 'as NAA';
        case FlagNames.Rude: return 'as R/A';
        case FlagNames.Spam: return 'as spam';
        case FlagNames.ModFlag: return 'for moderator attention';
        case FlagNames.VLQ: return 'as VLQ';
        case FlagNames.NoFlag:
        default: return '';
    }
}
