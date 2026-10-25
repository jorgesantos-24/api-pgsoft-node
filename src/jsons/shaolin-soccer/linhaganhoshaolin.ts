export default {
   async linhaganho(bet: number) {
      console.log("linha de ganho " + bet)

      const jsons: any = {
       
      }
      const base = Math.floor(Number(bet)) || 0
      const totalLinhas = Object.keys(jsons).length || 1
      const idx = ((base - 1) % totalLinhas + totalLinhas) % totalLinhas + 1
      return jsons[idx]
   },
}
