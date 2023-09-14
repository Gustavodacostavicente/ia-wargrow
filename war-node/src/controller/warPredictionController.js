const Country = require('../model/countryModel');
const Movement = require('../model/movementModel')
const frontiersConstants = require('../constants/frontiersConstants')
const objConstants = require('../constants/objConstants')
const continentConstants = require('../constants/continentConstants')

class Transfer {
    constructor(territory_i, territory_f, troops) {
      this.territory_i = territory_i;
      this.territory_f = territory_f;
      this.troops = troops;
    }
  }
  

const warPredictionController = {

    handleCountries(unhandledCountries, quantityTroops) {

        const handledCountries = [];

        if (unhandledCountries && unhandledCountries.length) {

            unhandledCountries.forEach(unhandledCountry => {

                unhandledCountry.class_name = unhandledCountry.class_name.replaceAll(' ', '_')

                const country = new Country(unhandledCountry.class_name, unhandledCountry.color_name);

                handledCountries.push(country);

            });

            this.populateFrontiers(handledCountries);

        }

        return handledCountries;

    },
    populateFrontiers(countries) {

        countries.forEach(country => {

            country.frontiers = frontiersConstants.countriesFrontiers
                .filter(frontier => frontier.countryName.toUpperCase() === country.name.toUpperCase())
                .map(f => f.frontiers);

        });

    },
    doFirstMove(quantityTroops, colorTeam, countries) {

        const groupByTeam = this.groupCountriesByColor(countries);

        const team = groupByTeam.filter(objGroup => objGroup.color.toUpperCase() === colorTeam.toUpperCase())[0];

        if (team.countries) {

            const movements = [];

            while (quantityTroops) {

                team.countries.forEach(country => {

                    if (quantityTroops) {

                        if (this.alreadyMoved(movements, country)) {

                            let editMovement = movements.filter(movement => movement.country === country)[0];

                            editMovement.quantityTroops++;

                        } else {
                            movements.push(new Movement(1, country))
                        }

                        quantityTroops--;

                    }

                })

            }
            return movements;
        }

    },
    groupCountriesByColor(countries) {

        const groupByColor = [];

        countries.forEach(country => {

            let objGroup = groupByColor.filter(obj => obj.color.toUpperCase() === country.color.toUpperCase())[0];

            if (objGroup) {

                if (!objGroup.countries) {
                    objGroup.countries = [];
                }

                objGroup.countries.push(country)

            } else {

                objGroup = {};
                objGroup.color = country.color.toUpperCase();
                objGroup.countries = [];

                objGroup.countries.push(country);

                groupByColor.push(objGroup);

            }

        });

        return groupByColor;

    },
    
    alreadyMoved(movements, country) {
        return movements.filter(movement => movement.country === country).length;
    },

    doAttack(data, colorTeam) {
        function calculateWinProbability(attackerTroops, defenderTroops) {
            // Mínimo de 1 e máximo de 3 tropas para o atacante
            const attackerTroopsSimulation = Math.min(attackerTroops, 3);
            // Mínimo de 1 e máximo de 2 tropas para o defensor
            const defenderTroopsSimulation = Math.min(defenderTroops, 2);
            const attackerResults = [];
            const defenderResults = [];
            // Simule rolagens de dados para o atacante
            for (let i = 0; i < attackerTroopsSimulation; i++) {
                attackerResults.push(Math.floor(Math.random() * 6) + 1); // Dado de 6 lados
            }
            // Simule rolagens de dados para o defensor
            for (let i = 0; i < defenderTroopsSimulation; i++) {
                defenderResults.push(Math.floor(Math.random() * 6) + 1); // Dado de 6 lados
            }
            // Ordene os resultados em ordem decrescente
            attackerResults.sort((a, b) => b - a);
            defenderResults.sort((a, b) => b - a);
            // Compare os resultados dos dados e determine o vencedor
            let attackerWins = 0;
            let defenderWins = 0;
            for (let i = 0; i < Math.min(attackerTroopsSimulation, defenderTroopsSimulation); i++) {
                if (attackerResults[i] > defenderResults[i]) {
                    attackerWins++;
                } else {
                    defenderWins++;
                }
            }
            // Calcule a probabilidade de vitória do atacante
            const attackerWinProbability = attackerWins / attackerTroopsSimulation;
            return attackerWinProbability;
        }
        let bestMoves = [];
        let highestProbability = 0;
        for (const territory of data) {
            const attackerTroops = parseInt(territory.troop);
            // Verifique se o território pertence ao colorTeam
            if (territory.color_name === colorTeam) {
                // Verifique as fronteiras deste território usando frontiersConstants
                const borders = frontiersConstants.countriesFrontiers.find(
                    (country) => country.countryName.toLowerCase() === territory.class_name.toLowerCase()
                );
                if (borders && borders.frontiers.length > 0) {
                    for (const destinationTerritoryName of borders.frontiers) {
                        // Encontre o território de destino correspondente
                        const destinationTerritory = data.find(
                            (t) => t.class_name.toLowerCase() === destinationTerritoryName.toLowerCase()
                        );
                        if (
                            destinationTerritory &&
                            destinationTerritory.color_name !== colorTeam
                        ) {
                            const defenderTroops = parseInt(destinationTerritory.troop);
                            // Calcular a probabilidade de vitória
                            const winProbability = calculateWinProbability(
                                attackerTroops,
                                defenderTroops
                            );
                            // Defina um limiar de probabilidade para decidir se você deseja atacar
                            const probabilityThreshold = 0.5; // Ajuste conforme necessário
                            // Verifique se esta jogada é uma das melhores
                            if (winProbability > probabilityThreshold) {
                                if (winProbability > highestProbability) {
                                    // Esta é a nova melhor jogada, limpa a lista anterior
                                    highestProbability = winProbability;
                                    bestMoves = [`${territory.class_name} ataque a ${destinationTerritory.class_name}`];
                                } else if (winProbability === highestProbability) {
                                    // Esta jogada tem a mesma probabilidade que a melhor jogada até agora
                                    bestMoves.push(`${territory.class_name} ataque a ${destinationTerritory.class_name}`);
                                }
                            }
                        }
                    }
                }
            }
        }
        return bestMoves;
    },
    findBestTransfersToReinforce(data, colorTeam) {
        const bestTransfers = []; // Inicialize um array vazio para armazenar as melhores transferências
        let maxTroopDifference = 0;
        const performedTransfers = []
        var countTransfersLen = 0;

        do {
            countTransfersLen = 0;
            // Iterar sobre os territórios para encontrar as melhores transferências
            for (const territory of data) {
                if (territory.color_name === colorTeam) {
                    // Verifique as fronteiras deste território usando frontiersConstants
                    const fronteiras = frontiersConstants.countriesFrontiers.find(
                        (country) => country.countryName.toLowerCase() === territory.class_name.toLowerCase()
                    );

                    if (fronteiras && fronteiras.frontiers.length > 0) {
                        for (const frontierName of fronteiras.frontiers) {
                            // Encontre o território de fronteira correspondente
                            const frontierTerritory = data.find(
                                (t) => t.class_name.toLowerCase() === frontierName.toLowerCase()
                            );

                            if (
                                frontierTerritory &&
                                frontierTerritory.color_name.toLowerCase() === colorTeam.toLowerCase()
                            ) {
                                // Calcule a diferença entre as tropas nos territórios
                                const troopDifference = territory.troop - frontierTerritory.troop;

                                // Verifique se a diferença é maior que a máxima registrada até agora
                                if (troopDifference > maxTroopDifference) {
                                    //bestTransfers.length = 0; // Limpe o array se encontrar uma diferença maior
                                    maxTroopDifference = troopDifference;
                                }

                                // Se a diferença for igual à máxima registrada, adicione ao array
                                //verifica se a diferença de tropas é maior que 0, para ser possível fazer o ataque
                                if (troopDifference === maxTroopDifference && troopDifference > 0) {
                                    
                                    
                                    var invalidPLay = false;
                                    
                                    for(const transfer of performedTransfers){
                                        if(transfer.territory_i === territory.class_name && transfer.territory_f === frontierTerritory.class_name){
                                            invalidPLay = true;
                                        }else if(transfer.territory_f === territory.class_name && transfer.territory_i === frontierTerritory.class_name){
                                            invalidPLay = true;
                                        }
                                    }
                                    
                                    if(invalidPLay){
                                        continue
                                    }
                                    
                                    //criando registro da transferência - para não ter como por acaso ser feito o proximo movimento o inverso deste. 
                                    performedTransfers.push(new Transfer(territory.class_name, frontierTerritory.class_name, troopDifference))
                                    //atualiza o numero de tropas do continente que transferiu
                                    data[data.indexOf(territory)].troop = data[data.indexOf(territory)].troop - troopDifference;      
                                    //atualizando o numero de tropas do continente que recebeu                           
                                    data[data.indexOf(frontierTerritory)].troop = (parseInt(data[data.indexOf(frontierTerritory)].troop) + troopDifference).toString();
                                    
                                    const transferMessage = `Mova ${troopDifference} tropas do ${territory.class_name} para o ${frontierTerritory.class_name}`;
                                    bestTransfers.push(transferMessage);

                                    countTransfersLen = performedTransfers.length;

                                }
                            }
                        }
                    }
                }
            }
        } while(countTransfersLen>0);

        if(bestTransfers.length===0){
            bestTransfers.push("Não há movimentos para fazer.");
        }

        return bestTransfers; // Retorna um array com as mensagens das melhores transferências
    },
}

module.exports = warPredictionController;
