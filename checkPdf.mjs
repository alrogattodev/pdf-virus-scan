import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ini from 'ini';

// Definir `__filename` e `__dirname` para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para converter um byte para formato hexadecimal
function byteToHex(byte) {
    return byte.toString(16).padStart(2, '0').toUpperCase();
}

// Função para converter um byte para formato binário
function byteToBinary(byte) {
    return byte.toString(2).padStart(8, '0');
}

// Função para criar uma string ASCII ou substituir por `.`
function byteToAscii(byte) {
    const char = String.fromCharCode(byte);
    return /[ -~]/.test(char) ? char : '.';
}

// Função para exibir dados em chunks organizados
function displayChunks(buffer, formatFunc, colorEven, colorOdd) {
    const chunkSize = 16;
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.slice(offset, offset + chunkSize);
        
        // Offset em hexadecimal
        const offsetHex = chalk.cyan(offset.toString(16).padStart(8, '0'));

        // Bytes formatados e coloridos
        let byteSection = '';
        let asciiSection = '';
        for (let i = 0; i < chunk.length; i++) {
            const coloredByte = (i % 2 === 0) ? colorEven(formatFunc(chunk[i])) : colorOdd(formatFunc(chunk[i]));
            byteSection += coloredByte + ' ';
            asciiSection += byteToAscii(chunk[i]);
        }

        // Exibir offset, bytes e ASCII
        console.log(`${offsetHex}  ${byteSection.padEnd(48)}  ${chalk.gray(asciiSection)}`);
    }
}

// Função para verificar a estrutura básica de um PDF
function checkPdfStructure(filePath, config) {
    const buffer = fs.readFileSync(filePath);

    // Converte o buffer para string
    const fileContent = buffer.toString('utf8');

    // Verifica se o PDF começa com %PDF
    const startsWithPdf = fileContent.startsWith('%PDF');
    
    // Verifica se o PDF termina com %%EOF
    const endsWithEof = fileContent.includes('%%EOF');

    // Escolha o formato de exibição com base na configuração
    const formatFunc = config.format === 'binary' ? byteToBinary : byteToHex;

    // Definir cores com base na configuração
    const colorEven = chalk[config.color_even] || chalk.green;
    const colorOdd = chalk[config.color_odd] || chalk.yellow;

    // Exibir dados em chunks organizados
    console.log(chalk.blue.bold(`\nPDF file content: (${config.format}):`));
    displayChunks(buffer, formatFunc, colorEven, colorOdd);

    //Show the final result
    if (startsWithPdf && endsWithEof) {
        console.log(chalk.green('The file looks a valid PDF.'));
    } else {
        console.log(chalk.red('The file looks corrupted or a fraudulent/invalid PDF.'));
    }    
}

// Função para carregar configurações do arquivo .cfg
function loadConfig() {
    const configPath = path.resolve(__dirname, 'config.cfg');
    if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        return ini.parse(configFile);
    } else {
        console.log(chalk.red('Config file "config.cfg" not found.'));
        process.exit(1);
    }
}

// Obter o nome do arquivo a partir dos argumentos de linha de comando
const [,, fileName] = process.argv;

if (!fileName) {
    console.log(chalk.red('Please provide the PDF filename as an argument.'));
    console.log('Usage: node checkPdf.mjs <nome-do-arquivo.pdf>');
    process.exit(1);
}

// Corrigir caminho absoluto para o arquivo PDF
const filePath = path.resolve(__dirname, decodeURIComponent(fileName));

// Carregar configurações do arquivo .cfg
const config = loadConfig();

// Verificar estrutura do PDF e exibir o conteúdo com base nas configurações
checkPdfStructure(filePath, config);
