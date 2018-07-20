/*
   Copyright 2017 David Corbett

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

browser.contextMenus.create({
    title: 'View Link as Text',
    contexts: ['link']
})

let url = undefined

browser.contextMenus.onClicked.addListener((info, tab) => {
        url = info.linkUrl
        if ('browsingData' in browser) {
            // If the page is cached, fetching it might return HTTP 304
            // Not Modified, in which case rewriting the Content-Type is
            // ineffective, so clear the cache first.
            browser.browsingData.removeCache({}).then(() =>
            browser.tabs.create({url}))
        } else {
            // If this is an old version of Firefox without the
            // browsingData API, add a random dummy parameter to make
            // sure the page will never have been visited before.
            url = new URL(url)
            url.searchParams.append('vlat' + Math.random(), 1)
            url = url.href
            browser.tabs.create({url})
        }
    })

browser.webRequest.onHeadersReceived.addListener(details => {
        if (details.url === url) {
            url = undefined
            for (let header of details.responseHeaders) {
                switch (header.name.toLowerCase()) {
                case 'content-disposition':
                    header.value = 'inline'
                    break
                case 'content-type':
                    header.value = 'text/plain'
                    break
                case 'location':
                    url = header.value
                    break
                }
            }
        }
        return {responseHeaders: details.responseHeaders}
    },
    {urls: ['<all_urls>']},
    ['blocking', 'responseHeaders'])

