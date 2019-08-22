/**
  *  This is a Trello JS "plugin" loader.
  *  
  *  Usage: Attach links to the plugins you wanna fetch and load.
 */

const plugins = [
  "https://gist.githubusercontent.com/CermakM/e51c2fead4e97e9bf341afdad62aac18/raw/e990b4ac5990d6c863ad3ee1abc8a330acf90e78/trello-sort.js",
  "https://raw.githubusercontent.com/CermakM/trello-utils/master/src/plugins/sp/counter.js"
]
const scripts = []


$('.trello-root').ready(function () { 
  
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
  }, 200)
})

