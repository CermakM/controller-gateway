/**
 * This is a Trello plugin for reconciling story points in Trello lists.
 * 
 * Usage:
 *   2) Set `COLUMN_REGEX` global variable
 *
 *      List of regex pattern for columns containing cards with story points to count
 */

let COLUMN_REGEX = env['COLUMN_REGEX'] || [/^Completed.*/, /^Next.*/, /^In Progress.*/];

(async function () {

    function getSPFromCardName(card) {
        const p = /\((\d+)\)/
        const m = card.match(p)
        if (m)
            return Number(m[1])

        return 0
    }

    function setColumnName(id, name) {
        Trello.put(`/lists/${id}`, {
            name: name
        })
    }

    function updateTrelloLists(lists) {
        lists.forEach(async (list) => {
            if (list.closed || !COLUMN_REGEX.some(p => p.test(list.name))) {
                console.log(`The list ${list.name} does not match required pattern. Skipping.`)
                return
            }

            const cards = await Trello.lists.get(`${list.id}/cards`)

            const storyPointsArray = cards.map(card => Number(getSPFromCardName(card.name)))
            const storyPointsTotal = storyPointsArray.reduce((a, b) => a + b, 0)

            const storyPointsCurrent = list.name.match(/\d+/)
            if (storyPointsCurrent != null) {
                try {
                    if (Number(storyPointsCurrent[0]) === storyPointsTotal) {
                        console.log(`The list ${list.name} is up to date. Skipping.`)
                        return
                    }
                } catch {
                    // ignore
                }
            }

            const columnName = list.name.replace(/ \(Total SP: \d+\)/, '')
            console.log('Updating list: ', columnName, list)

            setColumnName(list.id, `${columnName} (Total SP: ${storyPointsTotal})`)
        })
    }

    const url = '/boards/' + model.id + '/lists'
    await Trello.get(url)
        .then((lists) => {
            updateTrelloLists(lists)
        })
        .catch(err => console.error(err.response.toJSON()))
}())
