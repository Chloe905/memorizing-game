// 放在文件最上面，定義遊戲狀態
const GAME_STATE = {
  FirstCardAwaits : "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

// 四種花色放入陣列中
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// MVC架構分類程式碼，view為與畫面呈現相關
const view = {
  // 生成卡片內容
  //為省略寫法，相當於 getCardElement: function getCardElement() { ...  }
  getCardElement(index) {
    return `
    <div class="card back" data-index="${index}">
    </div>
  `
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1) //數字部分 1-13
    const symbol = Symbols[Math.floor(index / 13)] // 花色部分

    return `
      <p>${number}</p>
      <img src="${symbol}" alt="symbol">
      <p>${number}</p>
    `
  },
  // 將 1、11、12、13，用switch方法轉成A、J、Q、K
  transformNumber(number) {
    switch(number) {
      case 1 :
        return "A"
      case 11 :
        return "J"
      case 12 :
        return "Q"
      case 13 :
        return "K"
      default :
       return number
    }
  },
  flipCards(...cards) {
    cards.map((card) => {
      // 翻回正面，點到時，刪除背景圖，show出數字面
    if(card.classList.contains('back')) {
      card.classList.remove('back')
      card.innerHTML = this.getCardContent(card.dataset.index)  // 點擊到的card的index
      return
    }
    // 再點一次，蓋回背面 
    card.classList.add('back')
    card.innerHTML= null // 可以用''?
    })
  },
  // 將內容帶入('#cards')中
  displayCards(indexes) {  // indexes為打亂的隨機數組陣列
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML =  indexes.map(index => this.getCardElement(index)).join('') 
  },
  // 配對成功，改成灰底
  pairCards(...cards) { // ...把傳入的值變成array
    cards.map((card) => {
      card.classList.add('paired')
    })
  },
  renderScore (score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },
  renderTriedTimes (times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },
  appendWrongAnimaion(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend',event =>{
        event.target.classList.remove('wrong'),{once:true}
      })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
    <p>congratulation</p>
    <p>You complete the game.</p>
    <p>Score:${model.score}</p>
    <p>You've tried : ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}


// Fisher-Yates Shuffle 洗牌演算法
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1;index > 0;index --) {  //從最後一張開始抽，往前開始比對，所以抽到第二張即可，第一張不用(因為前面沒有可以比對的數了)
      let randomIndex = Math.floor(Math.random() * (index + 1)) // 隨機產生數字比對(ex:index=4;randomIndex=0~4隨機選一個數字)
      ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] // ;不可省略，不然會被默認為上一列執行語句
    }
    return number
  }
}


// model 存資料
const model = {
  revealedCards :[], //被翻開的卡片，存進這邊，再做比對

  // 是否配對成功
  isRevealedCardsMatched() {
    return Number(this.revealedCards[0].dataset.index) % 13 === Number(this.revealedCards[1].dataset.index) % 13
  },
  score : 0,  // 分數
  triedTimes : 0  // 玩幾次
}

// 由controller推進遊戲進行，不要讓controller以外內部函式，暴露在global中
const controller = {
  currentState : GAME_STATE.FirstCardAwaits, // 初始狀態，還沒翻牌
  // 發牌
  generateCards() {  
    view.displayCards(utility.getRandomNumberArray(52))
  },
  // 遊戲推進
  dispatchCardAction (card) {
    // 只點牌背，若以翻開，則不再理
    if(!card.classList.contains('back')) return
    if( model.revealedCards.length > 2) {return} // --->連續點擊三張，會放入三張進去model.revealedCards，跳至GAME_STATE.CardsMatchFailed

    switch(this.currentState) {
      case GAME_STATE.FirstCardAwaits :
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits :
        view.renderTriedTimes(model.triedTimes += 1)
        view.flipCards(card)
        model.revealedCards.push(card)

        console.log(model.isRevealedCardsMatched())
        //判斷是否配對成功
        if(model.isRevealedCardsMatched()) {
          // 成功
          view.renderScore(model.score += 10) // 每配對成功 +10
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards) // ...展開model.revealedCards陣列
          model.revealedCards = []
          if (model.score === 260) {
            console.log('end')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }

          this.currentState = GAME_STATE.FirstCardAwaits
          
        } else {
          // 失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimaion(...model.revealedCards)
          setTimeout(this.resetCards,1000)  // 1s時間記憶，翻回
        }
        break
    }
    console.log('this.currentState:'+this.currentState)
    console.log('revealedCard:',model.revealedCards.map(card => card.dataset.index))
  },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }

}



controller.generateCards() //取代view.displayCards

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click',event => {
    controller.dispatchCardAction(card)
  })
})

