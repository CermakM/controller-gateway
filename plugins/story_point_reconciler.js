/**
 * This is a Trello plugin for reconciling story points in Trello lists.
 * 
 * Usage:
 *   2) Set `COLUMN_REGEX` global variable
 *
 *      List of regex pattern for columns containing cards with story points to count
 */

(async function () {

    function getSPFromCardName(name) {
        const p = /\((\d+)\)/
        const m = name.match(p)
        if (m)
            return Number(m[1])

        return 0
    }

    async function updateTrelloLists(lists) {
        for (const list of lists) {
            if (list.closed || !modelConfig.columns.some(p => RegExp(p).test(list.name))) {
                continue
            }

            const cards = await Trello.lists.get(`${list.id}/cards`)

            const storyPointsArray = cards.map(card => Number(getSPFromCardName(card.name)))
            const storyPointsTotal = storyPointsArray.reduce((a, b) => a + b, 0)

            const storyPointsCurrent = list.name.match(/\d+/)
            if (storyPointsCurrent != null) {
                try {
                    if (Number(storyPointsCurrent[0]) === storyPointsTotal) {
                        console.log(`The list '${list.name}' is up to date. Skipping.`)
                        continue
                    }
                } catch {
                    // ignore
                }
            }

            const columnName = list.name.replace(/ \(Total SP: \d+\)/, '')
            console.log('Updating list: ', columnName, list)

            await Trello.put(`/lists/${list.id}`, {
                name: `${columnName} (Total SP: ${storyPointsTotal})`
            })
        }
    }

    // Configuration for the current Trello model
    const modelConfig = config.rules.find((r) => r.model.name === model.name)
    if (modelConfig == undefined) {
        console.error(`Configuration was not found for model '${model.name}'`)
        return
    }

    const url = '/boards/' + model.id + '/lists'
    await Trello.get(url)
        .then(async (lists) => {
            await updateTrelloLists(lists)
        })
        .catch(err => console.error(err.response.toJSON()))
}())
