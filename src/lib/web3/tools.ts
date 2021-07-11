import { ethers, Contract } from 'ethers'
import type { AskMi } from './askmi'
import { askMiFactory, loading, myAskMi, signer } from './store'
import { get } from 'svelte/store'
import { abi as askMiAbi } from '$lib/abi/AskMi.json'
import { abi as askMiFactoryAbi } from '$lib/abi/AskMiFactory.json'
import {
  provider,
  askMi,
  owner,
  tiers,
  questioners,
  questions,
  chainId,
} from './store'
import { getQuestionsSubset } from './eventListeners'
import type { AskMiFactory } from './askmi-factory'
import { detectAccountsChanged, detectChain } from './MetaMask'

// Get the ETH balance for any account in human-readable form
export async function getRoundedEthBalance(
  provider: ethers.providers.Web3Provider,
  address: string
) {
  // return the balance formated to ETH
  let ETH = ethers.utils.formatEther(await provider?.getBalance(address))
  return Math.floor(Number(ETH) * 100) / 100
}

function getProvider() {
  // Get the provider from the browser
  return new ethers.providers.Web3Provider(window.ethereum)
}

// Set up event listeners and load store with initial data
export async function setUpAskMi(address: string, _chainId: ImportMetaEnv['']) {
  // Check that the environment variables are loaded
  if (typeof _chainId == 'string') {
    // Get the web3 provider (MetaMask) and the contract object
    const _provider = getProvider()
    const _askMi = new Contract(
      address,
      askMiAbi,
      _provider.getSigner()
    ) as AskMi

    if (window.ethereum) {
      let _accounts = await _provider.listAccounts()
      signer.set(_accounts[0])
      // Detect when accounts are changed in MetaMask
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        signer.set(_accounts[0])
      })
    } else {
      // Prompt user to install MetaMask
      // Todo: Show pop up error message
      console.log('INSTALL METAMASK TO USE THIS DAPP!')
    }
    await detectChain(chainId)

    // Run once on page load
    await getQuestionsSubset(_askMi, questioners, questions)

    let _tiers = await _askMi.getTiers()
    let formattedTiers = _tiers.map((tier) => ethers.utils.formatEther(tier))

    // Load stores
    provider.set(_provider)
    askMi.set(_askMi)
    owner.set(await _askMi.owner())
    tiers.set(formattedTiers)
  } else {
    console.log('Enviroment variables not loaded.')
  }
}

// Set up event listeners and load store with initial data
export async function setUpAskMiFactory(
  address: ImportMetaEnv[''],
  _chainId: ImportMetaEnv['']
) {
  // Check that the environment variables are loaded
  if (typeof address == 'string' && typeof _chainId == 'string') {
    loading.set(true)
    // Get the web3 provider (MetaMask) and the contract object
    provider.set(getProvider())
    // Set the signer on page load
    signer.set((await get(provider).listAccounts())[0])
    // Detect account changes
    detectAccountsChanged(signer)
    // Get the chain and check for updates
    await detectChain(chainId)
    // Instantiate an AskMiFactory contract object
    askMiFactory.set(
      new Contract(
        address,
        askMiFactoryAbi,
        get(provider).getSigner()
      ) as AskMiFactory
    )

    try {
      myAskMi.set(await get(askMiFactory).getMyAskMi(get(signer)))
    } catch (error) {
      console.log('This address does not have an AskMi instance.')
    }

    loading.set(false)
  } else {
    console.log('Enviroment variables not loaded.')
  }
}