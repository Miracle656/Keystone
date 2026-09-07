// Privy's embedded-wallet crypto needs these polyfills present before anything else loads —
// see https://docs.privy.io/basics/react-native/setup. Order matters: they must run before
// expo-router (and therefore before any app code) touches Privy or viem.
import "react-native-get-random-values";

import { Buffer } from "buffer";
global.Buffer = Buffer;

import "@ethersproject/shims";
import "fast-text-encoding";

import "expo-router/entry";
