import pyautogui
import time
import webbrowser
import sys

Ciclos_Totais = 50
Confianca = 0.95

Localizado = False
def Procurar(IMG):
    time.sleep(3)
    global Localizado
    global Ciclo_Atual
    Ciclo_Atual = 0
    while(Localizado == False and Ciclo_Atual < Ciclos_Totais):
        Ciclo_Atual = Ciclo_Atual + 1
        Loc = pyautogui.locateOnScreen(IMG, confidence = Confianca)
        if(Loc != None): 
            pyautogui.moveTo(Loc)
            time.sleep(0.1)
            pyautogui.click()
            print('Procurando Imagem' + ' ' + str(IMG))
            Localizado = True
            time.sleep(3)
    Localizado = False
    
    if(Ciclo_Atual >= Ciclos_Totais):
        print('Erro ao encontrar o Elemento '+ str(IMG))
        sys.exit()
  
def Esperar(Tempo):
    print("Esperar Tempo")
    time.sleep(Tempo)

    
def Navegar(URL):
    print("Navegar URL")
    time.sleep(3)
    webbrowser.open(URL)
    time.sleep(3)
    
    
def Pressionar(Tecla):
    print("Pressionar Tecla")
    time.sleep(3)
    pyautogui.press(Tecla)
    
Esperar(5)
Navegar('https://play.wargrow.com.br/index2.html')
Esperar(10)
Procurar("1.jpg")
Esperar(2)
Procurar("2.jpg")
Procurar("3.jpg")
Procurar("4.jpg")
Procurar("5.jpg")
im = pyautogui.screenshot(region=(0,0, 300, 400))