/**
 * Copyright 2020 ZeoFlow SRL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const _ = require('lodash/fp')
const util = require('../util')

function injectListBetweenTags(newContent) {
    return function (previousContent) {
        const tagToLookFor = `<!-- ZEOBOT-LIST:`
        const closingTag = '-->'
        const startOfOpeningTagIndex = previousContent.indexOf(
            `${tagToLookFor}START`,
        )
        const endOfOpeningTagIndex = previousContent.indexOf(
            closingTag,
            startOfOpeningTagIndex,
        )
        const startOfClosingTagIndex = previousContent.indexOf(
            `${tagToLookFor}END`,
            endOfOpeningTagIndex,
        )
        if (
            startOfOpeningTagIndex === -1 ||
            endOfOpeningTagIndex === -1 ||
            startOfClosingTagIndex === -1
        ) {
            return previousContent
        }
        return [
            previousContent.slice(0, endOfOpeningTagIndex + closingTag.length),
            '\n<!-- prettier-ignore-start -->',
            '\n<!-- markdownlint-disable -->',
            newContent,
            '<!-- markdownlint-enable -->',
            '\n<!-- prettier-ignore-end -->',
            '\n',
            previousContent.slice(startOfClosingTagIndex),
        ].join('')
    }
}

function escapeName(name) {
    return name.replace(new RegExp('\\|', 'g'), '&#124;')
}

function formatContributorImage(contributor) {
    const nameContributor = escapeName(contributor['name'])
    const loginContributor = escapeName(contributor['login'])
    const avatarUrlContributor = escapeName(contributor['avatar_url'])

    const imageContent = `<img width="100" src="${avatarUrlContributor}" hspace=5 title='${nameContributor} (@${loginContributor}) - click for details about the contributions'>`
    const hrefTemp = (nameContributor + ' ' + loginContributor).replace(/ /g, '-').replace(/\./g, '').toLowerCase()

    return `<a href="docs/contributors.md#pushpin-${hrefTemp}">${imageContent}</a>`
}

function generateContributorsList(options, contributors) {
    return _.flow(
        _.map(function formatAllContributors(contributor) {
            return formatContributorImage(contributor)
        }),
        _.join(''),
        newContent => {
            return `\n<p float="left">\n${newContent}\n</p>\n\n`
        },
    )(contributors)
}

function getType(options, contribution) {
    const types = util.contributionTypes(options)
    return types[contribution.type || contribution]
}


module.exports = function generate(options, contributors, fileContent) {
    const contributorsList =
        contributors.length === 0
            ? '\n'
            : generateContributorsList(options, contributors)
    return _.flow(
        injectListBetweenTags(contributorsList),
    )(fileContent)
}
