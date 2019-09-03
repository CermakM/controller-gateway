/**
 * This is a Trello plugin for reconciling labels.
 * 
 */

(async function () {

    const COLUMN_REGEX = env['COLUMN_REGEX'] || [/^Backlog.*/, /^Next.*/, /^New.*/];
    // label IDs
    const LABEL_NEEDS_BACKLOG_REFINEMENT = '5a05c4a2e4c4d6248e26b696';


    function assignLabels(card) {
        // (?) in the title of the card -> needs-backlog-refinement
        const labels = []
        if ( card.name.search(/\(?\)/) ) {
            labels.push(LABEL_NEEDS_BACKLOG_REFINEMENT)
        }

        return labels
    }

    function hasLabel(card, labelID) {
        if (labelID === undefined) {
            throw Error('Argument `labelID` can not be undefined.')
        }
        return card.idLabels.includes(labelID)
    }

    function updateTrelloCards(cards) {
        cards.forEach(async (card) => {
            assignLabels(card).forEach( (labelID) => {
                if (hasLabel(card, labelID))
                    return  // nothing to be done

                Trello.post(`/cards/${card.id}/idLabels`, {value: labelID})
            })
        })
    }

    await Trello.get('/boards/' + model.id + '/lists/open')
        .then(async (lists) => {
            const cards = []
            for (const list of lists) {
                if (!COLUMN_REGEX.some(p => p.test(list.name))) {
                    console.log(`The list ${list.name} does not match required pattern. Skipping.`)
                    continue
                }

                console.log(`Collecting cards for culumn '${list.name}'.`)
                await Trello.get('/lists/' + list.id + '/cards')
                    .then(arr => cards.push(...arr))
            }

            return cards
        })
        .then((cards) => {
            console.log(`Updating ${cards.length} Trello cards`)
            updateTrelloCards(cards)
        })
        .catch(err => console.error(err.response ? err.response.toJSON() : err))
}())
