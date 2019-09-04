/**
 * This is a Trello plugin for reconciling labels.
 * 
 */

(async function () {

    function assignLabels(card, labels) {
        const assignedLabels = []
        for (const label of labels) {
            // make sure the selector is defined, otherwise it matches ALL
            if (label.selector == undefined) {
                throw Error('Undefined label selector.')
            }

            const re = new RegExp(label.selector)
            if ( card.name.search(re) !== -1) {
                assignedLabels.push(label.id)
            }
        }

        return assignedLabels
    }

    function hasLabel(card, labelID) {
        if (labelID === undefined) {
            throw Error('Argument `labelID` can not be undefined.')
        }
        return card.idLabels.includes(labelID)
    }

    function updateTrelloCards(cards, labels) {
        let failed  = 0,
            changed = 0;
        cards.forEach((card) => {
            assignLabels(card, labels).forEach( async (labelID) => {
                if (hasLabel(card, labelID)) {
                    return  // nothing to be done
                }

                await Trello.post(`/cards/${card.id}/idLabels`, {value: labelID})
                    .then(() => changed += 1)
                    .catch((err) => {
                        console.error('Error updating card:', err)
                        failed += 1
                    })
            })
        })

        console.log('Success.')
        console.log(`Changed ${changed} cards, ${cards.length - changed - failed} skipped and ${failed} failed.`)
    }

    // Configuration for the current Trello model
    const modelConfig = config.rules.find((r) => r.model.name === model.name)
    if (modelConfig == undefined) {
        console.error(`Configuration was not found for model '${model.name}'`)
        return
    }

    await Trello.get('/boards/' + model.id + '/lists/open')
        .then(async (lists) => {
            const cards = []
            for (const list of lists) {
                if (!modelConfig.columns.some(p => RegExp(p).test(list.name))) {
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
            updateTrelloCards(cards, modelConfig.labels)
        })
        .catch(err => console.error(err.response ? err.response.toJSON() : err))
}())
