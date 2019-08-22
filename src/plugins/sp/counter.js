/**
 * This is a Trello plugin for counting story points from card names.
 * 
 * Usage:
 *   1) Have SP set in card title as such "(<SP>) <title>"
 *   2) Set `COLUMN_REGEX` global variable
 *
 *      List of regex pattern for columns containing cards with story points to count
 */

COLUMN_REGEX = typeof COLUMN_REGEX !== 'undefined' ? COLUMN_REGEX : [/^Completed.*/, /^Next.*/, /^In Progress.*/];

(function() {

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

    function updateTrelloBoard(board) {
        const lists = board.lists

        lists.forEach(async(list)=>{
            if (list.closed || !COLUMN_REGEX.some(p=>p.test(list.name)))
                return

            const cards = await this.lists.get(`${list.id}/cards`)
            const storyPoints = cards.map(card=>Number(getSPFromCardName(card.name)))

            const total = storyPoints.reduce((a,b)=>a + b, 0)
            const columnName = list.name.replace(/ \(Total SP: \d+\)/, '')

            console.debug("Updating list: ", columnName, list)

            setColumnName(list.id, `${columnName} (Total SP: ${total})`)
        })
    }

    Trello.board.update = ()=>updateTrelloBoard.call(Trello, Trello.board)

    // Fetch the current board and update 
    Trello.board.get().then((board)=>{ Trello.board.update() })
}())

