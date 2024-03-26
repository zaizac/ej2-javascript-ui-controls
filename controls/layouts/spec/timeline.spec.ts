import { createElement, remove, isNullOrUndefined} from '@syncfusion/ej2-base';
import { Timeline, TimelineItemModel, TimelineRenderingEventArgs } from '../src/timeline/index';
import { getMemoryProfile, inMB, profile } from './common.spec';

describe('Timeline', () => {
    beforeAll(() => {
        const isDef: any = (o: any) => o !== undefined && o !== null;
        if (!isDef(window.performance)) {
            console.log('Unsupported environment, window.performance.memory is unavailable');
            this.skip(); // skips test (in Chai)
            return;
        }
    });

    describe('DOM', () => {
        let timeline: Timeline;
        let timelineElement: HTMLElement;

        beforeEach(() => {
            timelineElement = createElement('div', { id: 'timeline'});
            document.body.appendChild(timelineElement);
        });

        afterEach(() => {
            if (timeline) {
                timeline.destroy();
                timeline = undefined;
            }
            remove(timelineElement);
        });

        it('Default timeline testing', () => {
            timeline = new Timeline({
                items: [{}, {}, {}, {}]
            });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            timeline.orientation = 'horizontal';
            timeline.dataBind();
            expect(timelineElement.classList.contains('.e-vertical')).toEqual(false);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            timeline.orientation = 'vertical';
            timeline.dataBind();
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal')).toEqual(false);
        });

        it('Horizontal timeline testing', () => {
            timeline = new Timeline({
                items: [{}, {}, {}, {}]
            });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
        });

        it('Custom Icon', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-people'},
                {dotCss: 'e-icons e-signature'},
                {dotCss: 'e-icons e-location'},
                {dotCss: 'e-icons e-cut'}
            ];
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-dot');
            expect((liElementArray[0] as HTMLElement).classList.contains('e-people')).toEqual(true);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-signature')).toEqual(true);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-location')).toEqual(true);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-cut')).toEqual(true);
        });

        it('Get component name testing', () => {
            timeline = new Timeline({items: [{}, {}, {}, {}]});
            timeline.appendTo('#timeline');
            expect(timeline.getModuleName()).toEqual('timeline');
        });

        it('Timeline testing with Persistence', () => {
            timeline = new Timeline({
                items: [{}, {}, {}, {}],
                enablePersistence: true
            });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-timeline') != null).toEqual(true);
        });

        it('Generic div Element ID generation', () => {
            timeline = new Timeline({
                items: [{}, {}, {}, {}]
            });
            const timelineEle1 = createElement('div', {});
            document.body.appendChild(timelineEle1);
            timeline.appendTo(timelineEle1);
            expect(timelineEle1.getAttribute('id') != timelineElement.getAttribute('id')).toEqual(true);
            expect(isNullOrUndefined(timelineEle1.id)).toBe(false);
            timeline.destroy();
            timeline = undefined;
            remove(timelineEle1);
        });
    });
    
    describe('DOM Properties', () => {
        let timeline: Timeline;
        let timelineElement: HTMLElement;

        beforeEach(() => {
            timelineElement = createElement('div', { id: 'timeline'});
            document.body.appendChild(timelineElement);
        });

        afterEach(() => {
            if (timeline) {
                timeline.destroy();
                timeline = undefined;
            }
            remove(timelineElement);
        });

        it('cssClass', () => {
            timeline = new Timeline({
                items: [{}, {}, {}, {}],
                cssClass: 'testClass'
            });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.classList.contains('testClass')).toBe(true);
            timeline.cssClass = 'newClass';
            timeline.dataBind();
            expect(timelineElement.classList.contains('newClass')).toBe(true);
            expect(timelineElement.classList.contains('testClass')).toBe(false);
        });

        it('Item with cssClass', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-people', cssClass: 'testClass'},
                {dotCss: 'e-icons e-signature'},
                {dotCss: 'e-icons e-location'},
                {dotCss: 'e-icons e-cut'}
            ];
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelector('.e-timeline-item').classList).toContain('testClass');
        });

        it('Item with disabled', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-people', disabled: true},
                {dotCss: 'e-icons e-signature'},
                {dotCss: 'e-icons e-location'},
                {dotCss: 'e-icons e-cut'}
            ];
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelector('.e-timeline-item').classList).toContain('e-item-disabled');
            timeline.items[0].disabled = false;
            timeline.dataBind();
            expect(timelineElement.querySelector('.e-timeline-item').classList.contains('e-item-disabled')).toBe(false);
        });

        it('RTL', () => {
            timeline = new Timeline({
                items: [{}, {}, {}, {}],
                enableRtl: true
            });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.classList.contains('e-rtl')).toEqual(true);
            timeline.enableRtl = false;
            timeline.dataBind();
            expect(timelineElement.classList.contains('e-rtl')).toEqual(false);
            timeline.enableRtl = true;
            timeline.dataBind();
            expect(timelineElement.classList.contains('e-rtl')).toEqual(true);
        });

        it('text content', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with reverse feature', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, reverse: true });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-timeline-reverse')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
            timeline.reverse = false;
            timeline.dataBind();
            expect(timelineElement.classList.contains('e-timeline-reverse')).toEqual(false);
            timeline.reverse = true;
            timeline.dataBind();
            expect(timelineElement.classList.contains('e-timeline-reverse')).toEqual(true);
        });

        it('custom icon with text content', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-people', content: 'Ordered'},
                {dotCss: 'e-icons e-signature', content: 'Processing'},
                {dotCss: 'e-icons e-location', content: 'Shipped'},
                {dotCss: 'e-icons e-cut', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-dot');
            expect((liIconElementArray[0] as HTMLElement).classList.contains('e-people')).toEqual(true);
            expect((liIconElementArray[1] as HTMLElement).classList.contains('e-signature')).toEqual(true);
            expect((liIconElementArray[2] as HTMLElement).classList.contains('e-location')).toEqual(true);
            expect((liIconElementArray[3] as HTMLElement).classList.contains('e-cut')).toEqual(true);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with before position', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'before' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-before')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with alternate position', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternate' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternate')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with alternate reverse position', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternatereverse' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternatereverse')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('timeline content as js renderer ', () => {
            const customData: TimelineItemModel[] = [
                {content: '#itemContent'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            let content = 'Ordered';
            const renderer = createElement('script', { id: 'itemContent', innerHTML: content });
            renderer.setAttribute('type', 'text/x-jsrender');
            document.body.appendChild(renderer);
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
            content = null;
            remove(renderer);
        });

        it('timeline content with opposite content as js renderer ', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '#itemContent', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            let oppositeContent = '09:30 am';
            const renderer = createElement('script', { id: 'itemContent', innerHTML: oppositeContent });
            renderer.setAttribute('type', 'text/x-jsrender');
            document.body.appendChild(renderer);
            timeline = new Timeline({ items: customData });
            timeline.appendTo('#timeline');
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            oppositeContent = null;
            remove(renderer);
        });

        it('text content with opposite content with before', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'before' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-before')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content with alternate', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternate' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternate')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content with alternate reverse', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternatereverse' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternatereverse')).toEqual(true);
            expect(timelineElement.classList.contains('.e-vertical') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('custom icon with text content', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-people', content: 'Ordered'},
                {dotCss: 'e-icons e-signature', content: 'Processing'},
                {dotCss: 'e-icons e-location', content: 'Shipped'},
                {dotCss: 'e-icons e-cut', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-dot');
            expect((liIconElementArray[0] as HTMLElement).classList.contains('e-people')).toEqual(true);
            expect((liIconElementArray[1] as HTMLElement).classList.contains('e-signature')).toEqual(true);
            expect((liIconElementArray[2] as HTMLElement).classList.contains('e-location')).toEqual(true);
            expect((liIconElementArray[3] as HTMLElement).classList.contains('e-cut')).toEqual(true);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with before position', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'before', orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-before')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with alternate position', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternate', orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternate')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with alternate reverse position', () => {
            const customData: TimelineItemModel[] = [
                {content: 'Ordered'},
                {content: 'Processing'},
                {content: 'Shipped'},
                {content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternatereverse', orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternatereverse')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-after')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content with before', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'before', orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-before')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content with alternate', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternate', orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternate')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('text content with opposite content with alternate reverse', () => {
            const customData: TimelineItemModel[] = [
                {oppositeContent: '09:30 am', content: 'Ordered'},
                {oppositeContent: '10:30 am', content: 'Processing'},
                {oppositeContent: '11:30 am', content: 'Shipped'},
                {oppositeContent: '12:30 am', content: 'Delivered'}
            ];
            timeline = new Timeline({ items: customData, align: 'alternatereverse', orientation: 'horizontal' });
            timeline.appendTo('#timeline');
            expect(timelineElement.classList.contains('e-timeline')).toEqual(true);
            expect(timelineElement.classList.contains('e-align-alternatereverse')).toEqual(true);
            expect(timelineElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(timelineElement.querySelector('.e-timeline-items') != null).toEqual(true);
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-opposite-content').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-dot').length).toBe(4);
            expect(timelineElement.querySelectorAll('.e-content').length).toBe(4);
            const liIconElementArray: any = timelineElement.querySelectorAll('.e-opposite-content');
            expect((liIconElementArray[0] as HTMLElement).innerText).toEqual('09:30 am');
            expect((liIconElementArray[1] as HTMLElement).innerText).toEqual('10:30 am');
            expect((liIconElementArray[2] as HTMLElement).innerText).toEqual('11:30 am');
            expect((liIconElementArray[3] as HTMLElement).innerText).toEqual('12:30 am');
            const liElementArray: any = timelineElement.querySelectorAll('.e-content');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Ordered');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Processing');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Shipped');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Delivered');
        });

        it('created Property', () => {
            let isCreated: boolean = false;
            timeline = new Timeline({
                items: [{}, {}, {}, {}],
                created: () => { isCreated = true; }
            });
            timeline.appendTo('#timeline');
            const liElementArray: any = timelineElement.querySelectorAll('.e-timeline-item');
            expect(isCreated).toEqual(true);
        });

        it('beforeItemRender Property', () => {
            let count: number = 0;
            timeline = new Timeline({
                items: [{}, {}, {}, {}],
                beforeItemRender: (e: TimelineRenderingEventArgs) => {
                    count++;
                    expect(e.element.classList).toContain('e-timeline-item');
                }
            });
            timeline.appendTo('#timeline');
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect(count).toBe(4);
        });

        it('timeline with template support', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-folder', content: 'Item 1'},
                {dotCss: 'e-icons e-folder', content: 'Item 2'},
                {dotCss: 'e-icons e-folder', content: 'Item 3'},
                {dotCss: 'e-icons e-folder', content: 'Item 4'}
            ];
            timeline = new Timeline({ items: customData, template: '<span>${itemIndex}</span>' });
            timeline.appendTo('#timeline');
            const liElementArray: any = timelineElement.querySelectorAll('.e-timeline-item');
            expect(timelineElement.querySelectorAll('.e-timeline-item').length).toBe(4);
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('0');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('1');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('2');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('3');
            timeline.template = '<span>Item ${itemIndex}</span>';
            timeline.dataBind();
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Item 0');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Item 1');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Item 2');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Item 3');
        });

        it('timeline Template as js renderer ', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-folder', content: 'Item 1'},
                {dotCss: 'e-icons e-folder', content: 'Item 2'},
                {dotCss: 'e-icons e-folder', content: 'Item 3'},
                {dotCss: 'e-icons e-folder', content: 'Item 4'}
            ];
            let template = '<span class="tempContent">Item ${itemIndex}</span>';
            const renderer = createElement('script', { id: 'itemTemp', innerHTML: template });
            renderer.setAttribute('type', 'text/x-jsrender');
            document.body.appendChild(renderer);
            timeline = new Timeline({ items: customData, template: '#itemTemp' });
            timeline.appendTo('#timeline');
            const liElementArray: any = timelineElement.querySelectorAll('.e-timeline-item');
            expect(timelineElement.querySelector('.e-timeline-item').firstElementChild.classList).toContain('tempContent');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Item 0');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Item 1');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Item 2');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Item 3');
            template = null;
            remove(renderer);
        });

        it('timeline Template as HTMLElement ', () => {
            const customData: TimelineItemModel[] = [
                {dotCss: 'e-icons e-folder', content: 'Item 1'},
                {dotCss: 'e-icons e-folder', content: 'Item 2'},
                {dotCss: 'e-icons e-folder', content: 'Item 3'},
                {dotCss: 'e-icons e-folder', content: 'Item 4'}
            ];
            const template = '<span class="tempContent">Item ${itemIndex}</span>';
            const tempContent = createElement('div', { id: 'itemTemp', className: 'tempContent', innerHTML: template });
            document.body.appendChild(tempContent);
            timeline = new Timeline({ items: customData, template: '#itemTemp' });
            timeline.appendTo('#timeline');
            expect(document.querySelector('.tempContent') === null).toEqual(false);
            timeline.template = '#labelTemp1';
            timeline.dataBind();
            remove(tempContent);
        });

        it('memory leak', () => {
            profile.sample();
            const average: any = inMB(profile.averageChange);
            // check average change in memory samples to not be over 10MB
            expect(average).toBeLessThan(10);
            const memory: any = inMB(getMemoryProfile());
            // check the final memory usage against the first usage, there should be little change if everything was properly deallocated
            expect(memory).toBeLessThan(profile.samples[0] + 0.25);
        });
    });
});
