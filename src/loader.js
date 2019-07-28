/**
 *  This is a Trello JS "plugin" loader.
 *  
 *  Usage:
 *    Provide API key to the Trello account as global variable `APIKEY`
 *    Attach links to the plugins you wanna fetch and load.
 */


// APIKEY = ...

const plugins = [
	`https://trello.com/1/client.js?key=${APIKEY}`,
	"https://gist.githubusercontent.com/CermakM/e51c2fead4e97e9bf341afdad62aac18/raw/e990b4ac5990d6c863ad3ee1abc8a330acf90e78/trello-sort.js"
]
const scripts = []

$('.trello-root').ready(function () { 
	plugins.forEach( p => {
		const script = $('<script/>', {
			type: "text/javascript",
			crossorigin: 'anonymous',
			class : "trello-script"
		})

		fetch(p)
			.then( r => r.text())
			.then( t => script.text(t))
			.then( $('body').append(script) )
			.catch(console.error)
	})

	/**
	 *  Trello authentication
	 */

	function authenticationSuccess() {
		console.warn('Successful authentication')
	}

	function authenticationFailure() {
		console.warn('Failed authentication')
	}

	setTimeout( async () => {
		if (Trello.authorized()) {
			console.warn("Trello has already been authenticated.")
		}

		Trello.authorize({
			type: 'popup',
			name: 'Trello Utils',
			scope: {
				read: 'true',
				write: 'true'
			},
			persist: true,
			expiration: 'never',
			success: authenticationSuccess,
			error: authenticationFailure
		})

		Trello.board = {
			get: async () => {
				Object.assign(Trello.board, await $.get(document.URL + ".json"))

				return Trello.board
			}
		}

	}, 200)
})
