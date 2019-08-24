/**
 *  This is a Trello plugin for story point estimation and planning.
 *  
 *  Usage:
 *    1) Have SP set in card title as such "(<SP>) <title>"
 */

function getSP(card) {
	const p = /\((\d+)\)/
	const m = card.match(p)
	if (m)
		return Number(m[1])

	return 0
}

async function countSPFromColumn(columnId) {
	const cards = await Trello.lists.get(`${columnId}/cards`)

	return cards
		.map(card => Number(getSP(card.name)))
		.reduce((a, b)=>a + b, 0)
}

function median(arr) {
	const mid  = Math.floor(arr.length / 2),
		  nums = [...arr].sort((a, b) => a - b);

	return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function notify(title, options) {
	options = options || {}

	let notification = null;
	Notification.requestPermission().then(function (permission) {
		// If the user accepts, let's create a notification
		if (permission === "granted") {
			notification = new Notification(title, options);
		} else {
			console.warn("Notifications are not permitted in this context.")
		}
	})
}


_RE_CURRENT_COLUMN    = /In Progress/
_RE_COMPLETED_COLUMNS = /Completed.*/
_RE_NEXT_COLUMN       = /Next/

_THRESHOLD = 8;  // limit of previous - current story points

(function() {

	Trello.board.get().then(async (board)=>{

		const lists = board.lists
			.filter( (list) => !list.closed )

		const listsCompleted = lists
			.filter( (list) => _RE_COMPLETED_COLUMNS.test(list.name) )

		const spCompleted = listsCompleted.map( async (list) => {
			const sp = await countSPFromColumn(list.id)

			return {
				column: list.name,
				sp: sp
			}
		})

		console.debug("Completed SP:", spCompleted)

		const spMedian = await Promise.all(spCompleted)
			.then( (data) => {
				console.debug("completed SP: ", data)
				return data.map( d => d.sp )
			})
			.then( (data) => {
				console.debug("Computing median of array: ", data)
				return median(data)
			})
			.catch(console.error)

		console.debug("Median of completed SP: ", spMedian)

		for ( const column of [_RE_CURRENT_COLUMN, _RE_NEXT_COLUMN] ) {
			console.debug(`Validating number of SP in column: ${column}`)

			const list = lists
				.filter( (list) => !list.closed && column.test(list.name) )
				.pop()

			if ( list === undefined ) {
				console.warn(`No matching list: ${column}`)
				continue
			}

			const sp = await countSPFromColumn(list.id)
			console.debug("Current story points: ", list.name, sp)

			if ( sp > spMedian + _THRESHOLD ) {
				const msg = `Current number of SP in column '${list.name}' is higher than expected: ${spMedian}`
				console.warn(msg)
				console.warn("Sending notification.")

				notify(msg)
			}
		}
	})
}())
