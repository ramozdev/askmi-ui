import { ethers, utils } from 'ethers'
import { Buffer } from 'buffer'
import type { Cid } from 'src/web3/contract'

/**
 * @typedef {Object} Multihash
 * @property {string} digest The digest output of hash function in hex with prepended '0x'
 * @property {number} hashFunction The hash function code for the function used
 * @property {number} size The length of digest
 */

/**
 * Partition multihash string into object representing multihash
 *
 * @param {string} multihash A base58 encoded multihash string
 * @returns {Multihash}
 */
export function getBytes32FromMultiash(multihash: string) {
  const decoded = utils.base58.decode(multihash)

  return {
    digest: utils.hexlify(decoded.slice(2)),
    hashFunction: ethers.BigNumber.from(decoded[0]),
    size: ethers.BigNumber.from(decoded[1]),
  }
}

/**
 * Encode a multihash structure into base58 encoded multihash string
 *
 * @param {Multihash} multihash
 * @returns {(string|null)} base58 encoded multihash string
 */
export function getMultihashFromBytes32(multihash: Cid) {
  const { digest, hashFunction, size } = multihash
  if (size.toNumber() === 0) return null

  // cut off leading "0x"
  const hashBytes = Buffer.from(digest.slice(2), 'hex')

  // prepend hashFunction and digest size
  // @ts-ignore
  const multihashBytes = new hashBytes.constructor(2 + hashBytes.length)
  multihashBytes[0] = hashFunction
  multihashBytes[1] = size
  multihashBytes.set(hashBytes, 2)

  return utils.base58.encode(multihashBytes)
}
